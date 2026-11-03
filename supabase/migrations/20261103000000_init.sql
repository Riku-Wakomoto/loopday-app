-- Loopday MVP schema.
-- Video files live in Cloudflare R2; this database stores only metadata.
-- Every table has row level security so that clips are visible only to
-- members of the clip's group.

create extension if not exists pgcrypto;

-- Profiles ------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 30),
  birthdate date not null,
  country text not null check (country in ('TH', 'SA', 'MX')),
  language text not null default 'en',
  -- Minors (under the country's age of majority) need guardian consent.
  is_minor boolean not null,
  guardian_consent_at timestamptz,
  -- Hours (local) when hourly prompts are not sent, e.g. class time.
  quiet_hours int[] not null default '{}',
  push_token text,
  created_at timestamptz not null default now(),
  check (not is_minor or guardian_consent_at is not null)
);

-- Groups --------------------------------------------------------------------

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40),
  capacity int not null check (capacity between 1 and 20),
  country text not null check (country in ('TH', 'SA', 'MX')),
  time_zone text not null,
  -- Local hour at which a day of clips ends (4 = 04:00).
  day_boundary_hour int not null default 4 check (day_boundary_hour between 0 and 23),
  -- Where this group's clips are stored, so a region can be chosen per market.
  storage_region text not null default 'apac',
  invite_code text not null unique default upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8)),
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create index group_members_user_idx on public.group_members (user_id);

-- Helper used by policies. SECURITY DEFINER avoids recursive RLS checks on
-- group_members itself.
create or replace function public.is_group_member(gid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.group_members
    where group_id = gid and user_id = auth.uid()
  );
$$;

-- Clips ---------------------------------------------------------------------

create table public.clips (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  -- Object key in R2. The file is uploaded with a signed URL.
  storage_key text not null unique,
  day date not null,          -- the group-local day the clip belongs to
  hour int not null check (hour between 0 and 23),
  duration_ms int not null check (duration_ms between 500 and 3000),
  caption text check (char_length(caption) <= 40),
  recorded_at timestamptz not null,
  deleted_at timestamptz,     -- soft delete; files are purged by a job
  created_at timestamptz not null default now()
);

create index clips_group_day_idx on public.clips (group_id, day, hour);

create table public.reactions (
  clip_id uuid not null references public.clips (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  emoji text not null check (char_length(emoji) <= 8),
  created_at timestamptz not null default now(),
  primary key (clip_id, user_id, emoji)
);

-- Safety --------------------------------------------------------------------

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  clip_id uuid references public.clips (id) on delete set null,
  reported_user_id uuid references public.profiles (id) on delete set null,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null check (reason in ('nudity', 'bullying', 'violence', 'privacy', 'illegal', 'other')),
  details text check (char_length(details) <= 500),
  status text not null default 'open' check (status in ('open', 'actioned', 'dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

-- Row level security --------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.clips enable row level security;
alter table public.reactions enable row level security;
alter table public.reports enable row level security;
alter table public.blocks enable row level security;

-- Profiles: you can read people you share a group with, and edit only yourself.
create policy profiles_select on public.profiles for select using (
  id = auth.uid()
  or exists (
    select 1 from public.group_members me
    join public.group_members them on them.group_id = me.group_id
    where me.user_id = auth.uid() and them.user_id = profiles.id
  )
);
create policy profiles_insert on public.profiles for insert with check (id = auth.uid());
create policy profiles_update on public.profiles for update using (id = auth.uid());

-- Groups: members can read; anyone signed in can create. Joining by invite
-- code goes through an RPC, not a direct insert.
create policy groups_select on public.groups for select using (public.is_group_member(id));
create policy groups_insert on public.groups for insert with check (created_by = auth.uid());

create policy members_select on public.group_members for select using (public.is_group_member(group_id));
create policy members_leave on public.group_members for delete using (user_id = auth.uid());

-- Clips: members read clips that are not deleted and not from people they
-- blocked; you can only add and delete your own.
create policy clips_select on public.clips for select using (
  deleted_at is null
  and public.is_group_member(group_id)
  and not exists (
    select 1 from public.blocks b
    where b.blocker_id = auth.uid() and b.blocked_id = clips.user_id
  )
);
create policy clips_insert on public.clips for insert with check (
  user_id = auth.uid() and public.is_group_member(group_id)
);
create policy clips_soft_delete on public.clips for update using (user_id = auth.uid());

create policy reactions_select on public.reactions for select using (
  exists (select 1 from public.clips c where c.id = clip_id and public.is_group_member(c.group_id))
);
create policy reactions_insert on public.reactions for insert with check (
  user_id = auth.uid()
  and exists (select 1 from public.clips c where c.id = clip_id and public.is_group_member(c.group_id))
);
create policy reactions_delete on public.reactions for delete using (user_id = auth.uid());

-- Reports are write-only for users; moderators use the service role.
create policy reports_insert on public.reports for insert with check (reporter_id = auth.uid());

create policy blocks_select on public.blocks for select using (blocker_id = auth.uid());
create policy blocks_insert on public.blocks for insert with check (blocker_id = auth.uid());
create policy blocks_delete on public.blocks for delete using (blocker_id = auth.uid());

-- RPCs ----------------------------------------------------------------------

-- Creates a group and adds the creator as its first member in one step.
create or replace function public.create_group(
  p_name text, p_capacity int, p_country text, p_time_zone text, p_storage_region text
) returns public.groups
language plpgsql
security definer
set search_path = public
as $$
declare g public.groups;
begin
  insert into public.groups (name, capacity, country, time_zone, storage_region, created_by)
  values (p_name, p_capacity, p_country, p_time_zone, p_storage_region, auth.uid())
  returning * into g;
  insert into public.group_members (group_id, user_id) values (g.id, auth.uid());
  return g;
end;
$$;

-- Joins a group by invite code, respecting its capacity.
create or replace function public.join_group(p_code text)
returns public.groups
language plpgsql
security definer
set search_path = public
as $$
declare g public.groups;
begin
  select * into g from public.groups where invite_code = upper(p_code) for update;
  if not found then
    raise exception 'invalid_code';
  end if;
  if (select count(*) from public.group_members where group_id = g.id) >= g.capacity then
    raise exception 'group_full';
  end if;
  insert into public.group_members (group_id, user_id)
  values (g.id, auth.uid())
  on conflict do nothing;
  return g;
end;
$$;

revoke all on function public.create_group(text, int, text, text, text) from public;
revoke all on function public.join_group(text) from public;
grant execute on function public.create_group(text, int, text, text, text) to authenticated;
grant execute on function public.join_group(text) to authenticated;
