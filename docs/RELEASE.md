# Releasing Loopday

How to build, sign and submit the app with EAS. Signing certificates and
keystores are created and stored by EAS, so nobody needs Xcode or Android
Studio. The full checklist (accounts, legal, review answers) lives in the
project's release checklist doc.

## One-time setup

1. Create an Expo account at expo.dev, then in `mobile/`:

   ```bash
   npx eas-cli@latest login
   npx eas-cli@latest init        # links the project and writes extra.eas.projectId to app.json
   ```

2. Apple: enroll in the Apple Developer Program as the company, then create
   the app in App Store Connect with bundle ID `app.loopday.mobile`.
3. Google: create the app in Play Console with package name
   `app.loopday.mobile`. The first upload of an Android build must be done by
   hand in Play Console (Internal testing → Create release). After that,
   `eas submit` can upload.
4. Enable GitHub Pages (Settings → Pages → Deploy from a branch → `main`,
   folder `/docs`) so the privacy policy, terms and support pages are online at
   `https://riku-wakomoto.github.io/loopday-app/`. If you buy a domain, set it
   there and update `SITE_URL` in `mobile/src/lib/links.ts`.
5. Fill in every `[PLACEHOLDER]` in `docs/legal/*.md` and `docs/support.md`,
   and `SUPPORT_EMAIL` in `mobile/src/lib/links.ts`.

## Build profiles (`mobile/eas.json`)

| Profile | What it makes | Use |
| --- | --- | --- |
| `preview` | iOS ad-hoc build and Android APK | Installing on your own and testers' phones before TestFlight |
| `production` | Store builds, build number increased automatically | TestFlight, Play testing tracks, and release |

Version numbers: `version` in `app.json` is what users see (1.0.0). Build
numbers are stored on EAS (`appVersionSource: remote`) and go up by one on
every production build.

## Build and submit

```bash
cd mobile
npx eas-cli@latest build --platform all --profile production
npx eas-cli@latest submit --platform ios --latest      # to TestFlight
npx eas-cli@latest submit --platform android --latest  # to the internal testing track, as a draft
```

The first iOS build asks to sign in with the Apple ID and creates the
distribution certificate and provisioning profile. Let EAS manage them.

## Before every submission

- `npm run typecheck`, `npm test` and `npx expo-doctor` pass.
- Bump `version` in `app.json` for a new store version.
- Check the app on a real iPhone and a low-end Android phone from a
  `preview` build, including camera denial, report, block and account
  deletion.
