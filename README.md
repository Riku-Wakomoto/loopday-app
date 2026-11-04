# Loopday

Friends share 2-second clips every hour; the day becomes a group vlog.
First market: Thailand (closed beta February 2027), then Saudi Arabia and Mexico.

## Layout

| Path | What it is |
| --- | --- |
| `mobile/` | iOS and Android app (Expo, React Native, TypeScript, Expo Router) |
| `supabase/migrations/` | Database schema and row level security (Supabase Postgres) |
| `.github/workflows/` | CI: typecheck, unit tests, migration check |
| `docs/` | Public privacy policy, terms and support pages (GitHub Pages), store listing copy, release steps (`docs/RELEASE.md`) |

Video files are compressed on the device and stored in Cloudflare R2
(no egress fees). The database only holds metadata.

## Run the app

```bash
cd mobile
npm install
npx expo start
```

Checks: `npm run typecheck` and `npm test`.

## Per-country settings

Age limits, day boundary (04:00 by default), time zone and storage region
live in `mobile/src/lib/countries.ts`. Screens read from there so that
Saudi Arabia and Mexico can be added without rewriting them.
