import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { AgeStatus } from '../lib/age';
import { COUNTRIES, LAUNCH_COUNTRY } from '../lib/countries';
import { dayKey, localHour } from '../lib/day';

// In-memory app state for the scaffold. Replaced by Supabase-backed data
// (see supabase/migrations) in the next milestone.

export interface Profile {
  displayName: string;
  birthdate: string; // YYYY-MM-DD
  ageStatus: Exclude<AgeStatus, 'blocked'>;
  guardianConsent: boolean;
}

export interface Room {
  id: string;
  name: string;
  /** Maximum members including the creator. */
  capacity: number;
  members: string[];
}

export interface Message {
  id: string;
  author: string;
  text: string;
  sentAt: number;
  /** Set when the message is a posted clip. */
  clip?: ClipRef;
  /** The message this one replies to. */
  replyTo?: string;
  /** One reaction per member, by display name. */
  reactions: Record<string, Reaction>;
}

/** A heart, or a selfie taken as the reaction (photo file on the device). */
export type Reaction = { kind: 'heart' } | { kind: 'face'; uri: string };

/** A 2-second clip, kept on the device until uploads are wired. */
export interface Clip {
  author: string;
  uri: string;
  recordedAt: number;
  /** Local hour it was recorded in, shown as "14:00". */
  hour: number;
  /** Optional one-line caption shown under the time. */
  caption: string;
}

export type ClipRef = Pick<Clip, 'uri' | 'hour' | 'caption' | 'recordedAt'>;

/** Clips by day key → local hour → one clip per member. */
export type ClipLog = Record<string, Record<number, Clip[]>>;

/** Matches the `reports.reason` check in the database. */
export const REPORT_REASONS = ['nudity', 'bullying', 'violence', 'privacy', 'illegal', 'other'] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

/** A report waiting to be sent to the moderation queue (`public.reports`). */
export interface SafetyReport {
  roomId: string;
  reportedMember: string;
  messageId?: string;
  clipRecordedAt?: number;
  reason: ReportReason;
  createdAt: number;
}

interface AppState {
  profile: Profile | null;
  messages: Record<string, Message[]>;
  sendMessage: (roomId: string, text: string, replyTo?: string) => void;
  toggleHeart: (roomId: string, messageId: string) => void;
  setFaceReaction: (roomId: string, messageId: string, uri: string) => void;
  clips: Record<string, ClipLog>;
  /** Saves my clip for the current hour (replacing an earlier take) and posts it to the chat. */
  addClip: (roomId: string, uri: string, caption: string) => void;
  me: string;
  draft: Partial<Profile>;
  rooms: Room[];
  updateDraft: (patch: Partial<Profile>) => void;
  completeOnboarding: () => void;
  createRoom: (name: string, capacity: number) => Room;
  /** Members I blocked. Their clips and messages are hidden from me. */
  blocked: string[];
  reports: SafetyReport[];
  report: (r: Omit<SafetyReport, 'createdAt'>) => void;
  block: (member: string) => void;
  /** Deletes my clip for that hour, and its post in the chat. */
  deleteMyClip: (roomId: string, recordedAt: number) => void;
  /** Deletes the profile, groups, clips and messages on this device. */
  deleteAccount: () => void;
}

const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [draft, setDraft] = useState<Partial<Profile>>({});
  const [rooms, setRooms] = useState<Room[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [clips, setClips] = useState<Record<string, ClipLog>>({});
  const [blocked, setBlocked] = useState<string[]>([]);
  const [reports, setReports] = useState<SafetyReport[]>([]);
  const me = profile?.displayName ?? draft.displayName ?? 'Me';

  const setReaction = (
    roomId: string,
    messageId: string,
    next: (current: Reaction | undefined) => Reaction | undefined,
  ) =>
    setMessages((m) => ({
      ...m,
      [roomId]: (m[roomId] ?? []).map((msg) => {
        if (msg.id !== messageId) return msg;
        const reactions = { ...msg.reactions };
        const value = next(reactions[me]);
        if (value) reactions[me] = value;
        else delete reactions[me];
        return { ...msg, reactions };
      }),
    }));

  const value = useMemo<AppState>(
    () => ({
      profile,
      draft,
      rooms,
      messages,
      sendMessage: (roomId, text, replyTo) => {
        const message: Message = {
          id: Math.random().toString(36).slice(2, 10),
          author: me,
          text,
          sentAt: Date.now(),
          replyTo,
          reactions: {},
        };
        setMessages((m) => ({ ...m, [roomId]: [...(m[roomId] ?? []), message] }));
      },
      toggleHeart: (roomId, messageId) =>
        setReaction(roomId, messageId, (current) =>
          current?.kind === 'heart' ? undefined : { kind: 'heart' },
        ),
      setFaceReaction: (roomId, messageId, uri) =>
        setReaction(roomId, messageId, () => ({ kind: 'face', uri })),
      clips,
      me,
      addClip: (roomId, uri, caption) => {
        const { timeZone, dayBoundaryHour } = COUNTRIES[LAUNCH_COUNTRY];
        const now = new Date();
        const day = dayKey(now, timeZone, dayBoundaryHour);
        const hour = localHour(now, timeZone);
        const clip: Clip = { author: me, uri, recordedAt: now.getTime(), hour, caption };
        const ref: ClipRef = { uri, hour, caption, recordedAt: clip.recordedAt };
        // Post it to the chat; a retake in the same hour replaces my earlier post.
        setMessages((m) => {
          const list = m[roomId] ?? [];
          const sameHour = (msg: Message) =>
            msg.author === me &&
            msg.clip?.hour === hour &&
            dayKey(new Date(msg.clip.recordedAt), timeZone, dayBoundaryHour) === day;
          const earlier = list.find(sameHour);
          if (earlier) {
            return {
              ...m,
              [roomId]: list.map((msg) => (msg === earlier ? { ...msg, clip: ref, text: caption } : msg)),
            };
          }
          const message: Message = {
            id: Math.random().toString(36).slice(2, 10),
            author: me,
            text: caption,
            sentAt: clip.recordedAt,
            clip: ref,
            reactions: {},
          };
          return { ...m, [roomId]: [...list, message] };
        });
        setClips((c) => {
          const log = c[roomId] ?? {};
          const hours = log[day] ?? {};
          const others = (hours[hour] ?? []).filter((x) => x.author !== me);
          return { ...c, [roomId]: { ...log, [day]: { ...hours, [hour]: [...others, clip] } } };
        });
      },
      updateDraft: (patch) => setDraft((d) => ({ ...d, ...patch })),
      completeOnboarding: () => {
        if (!draft.displayName || !draft.birthdate || !draft.ageStatus) return;
        setProfile({
          displayName: draft.displayName,
          birthdate: draft.birthdate,
          ageStatus: draft.ageStatus,
          guardianConsent: draft.guardianConsent ?? false,
        });
      },
      createRoom: (name, capacity) => {
        const room: Room = {
          id: Math.random().toString(36).slice(2, 10),
          name,
          capacity,
          members: [me],
        };
        setRooms((r) => [room, ...r]);
        return room;
      },
      blocked,
      reports,
      // Kept on the device until the Supabase milestone sends it to the queue.
      report: (r) => setReports((list) => [...list, { ...r, createdAt: Date.now() }]),
      block: (member) => setBlocked((list) => (list.includes(member) ? list : [...list, member])),
      deleteMyClip: (roomId, recordedAt) => {
        setClips((c) => {
          const log = c[roomId] ?? {};
          const next: ClipLog = {};
          for (const [day, hours] of Object.entries(log)) {
            next[day] = {};
            for (const [h, list] of Object.entries(hours)) {
              next[day][Number(h)] = list.filter((x) => !(x.author === me && x.recordedAt === recordedAt));
            }
          }
          return { ...c, [roomId]: next };
        });
        setMessages((m) => ({
          ...m,
          [roomId]: (m[roomId] ?? []).filter(
            (msg) => !(msg.author === me && msg.clip?.recordedAt === recordedAt),
          ),
        }));
      },
      deleteAccount: () => {
        setProfile(null);
        setDraft({});
        setRooms([]);
        setMessages({});
        setClips({});
        setBlocked([]);
        setReports([]);
      },
    }),
    [profile, draft, rooms, messages, clips, me, blocked, reports],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAppState must be used inside AppStateProvider');
  return ctx;
}
