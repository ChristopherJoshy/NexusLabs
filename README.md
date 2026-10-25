# NexusLabs

![CI](https://github.com/ChristopherJoshy/NexusLabs/actions/workflows/ci.yml/badge.svg?branch=main)

NexusLabs is an independent, monochrome student app for SJCET Palai. It presents student information from the official SJCET Etlab portal in a focused mobile experience. The portal remains the source of official academic records.

## Current scope

The app includes student sign-in, a home view, attendance, timetable, assignments, notices, materials, fee information, results, local assignment reminders, Privacy, and About screens. Availability depends on the signed-in account and data returned by Etlab.

The product is being expanded toward complete student-facing Etlab coverage, including all results categories and fee payments. Fee payment initiation and some results categories are not yet implemented, so the current app must not be treated as a complete replacement for Etlab.

## Technology

- Expo SDK 58 and React Native 0.88
- TypeScript, Expo Router, TanStack Query, Zustand, and SecureStore
- Node.js 24.22.0 (`.nvmrc`) and npm
- Android package: `in.nexuslabs.sjcet`

## Run locally

Use Node.js 24.22.0 and install the locked dependencies:

```powershell
npm ci
npx expo start
```

To start Expo on an available Android emulator:

```powershell
npx expo start --android
```

For a local native Android build:

```powershell
npx expo run:android
```

Expo generates native projects through Continuous Native Generation. Keep native configuration in `app.json` and config plugins; do not commit generated `android/` or `ios/` directories.

## Quality checks

Run these from the repository root before committing app changes:

```powershell
npm run typecheck
npm run lint
npm test
npx expo export --platform android --output-dir .export-smoke
npx expo-doctor
```

GitHub Actions runs type checking, lint, unit tests, and an Android bundle export on pushes and pull requests targeting `main`.

## Project layout

```text
src/
  app/          Expo Router screens and layouts
  components/   Shared interface components
  hooks/        Reusable React hooks
  lib/          API, domain, and formatting utilities
  providers/    App-wide providers
  stores/       Local app state
  theme/        Monochrome design tokens and theme access
tests/          Focused unit tests
assets/         App icons, fonts, and artwork
```

Keep API validation at the network boundary, domain calculations in pure functions, and screens focused on composition and interaction. Follow [AGENTS.md](AGENTS.md) for product, privacy, design, Android, and repository rules.

## Data and privacy

NexusLabs connects directly to `https://sjcetpalai.etlab.in/androidapp/`. It does not use an app server or proxy. Session credentials are stored in Android/iOS secure storage; cached academic data remains on the device. Never commit a student username, password, session token, live account response, or private screenshot.

Live account checks must remain read-only. Do not submit leave requests, assignments, surveys, hostel registrations, or payments during development verification. A payment flow must preserve the student's explicit confirmation and transfer control to the official payment provider.

NexusLabs is an independent project and is not affiliated with or endorsed by Etlab. The Etlab portal remains the authority for records and transactions.

## Repository policy

The Git repository contains the NexusLabs mobile app and the app-specific files needed to build, verify, document, and maintain it. APKs, reverse-engineering evidence, and unrelated workspace material stay outside this repository. Changes are committed with focused Conventional Commit messages and pushed to `main` after relevant checks pass.

No license has been added yet. Public repository visibility does not grant permission to reuse the source.
