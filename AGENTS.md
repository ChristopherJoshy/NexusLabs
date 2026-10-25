This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## NexusLabs scope for this task

The current product goal is **NexusLabs for SJCET Palai only**. In the full development workspace, read the parent-level `../design.md`, `../memory.md`, `../history.md`, and `../docs/ETLAB_ANDROID_MAP.md` before changing screens or API behavior. Those workspace research files are intentionally kept outside this mobile-only Git repository. In a clean clone where they are absent, follow the product and source constraints below and derive Etlab behavior only from evidence available in that checkout. Some existing files still describe the earlier “Etlab One” multi-college prototype; those are historical and do not override the current product scope.

- The only live Etlab host is `sjcetpalai.etlab.in`, under `https://sjcetpalai.etlab.in/androidapp/`. Reject another host or a redirect away from SJCET. Remove the general college directory/manual-host path as part of the product migration.
- Use the Etlab APK and REA evidence only to understand behavior and protocol shape. Implement new, maintainable NexusLabs logic; do not paste decompiled methods or copy official assets.
- Keep official, local, cached, estimated, and missing values distinct. Do not manufacture attendance, results, fee balances, or submission outcomes.
- Never put the user’s private test credentials in source, fixtures, logs, or screenshots. Use the authorized account only for read-only live verification; never trigger a payment or submit an official form during testing.
- Follow workspace `design.md`: strict neutral monochrome, using only black, white, and achromatic greys. There are no chromatic status colours; status must include a label plus an icon, dot, fill/outline, or shape. Render the portal profile photo with the shared grayscale filter and do not add colour assets or hard-coded colours outside the theme tokens.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npm run lint                # ESLint directly; `expo lint` misreads the installed version
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## Project-local guidance

The full development workspace may provide local reference skills and supplementary API/research notes outside this app directory. They are intentionally excluded from this Git repository. Use the installed skill catalog when available; keep this file and the tracked `src/lib/api/` implementation sufficient for work in a clean clone.

The full workspace keeps a supplementary Etlab `/androidapp/` API reference at `../docs/API.md`. It is not part of this app-only repository; `src/lib/api/` is the tracked API boundary here. Prefer measured client-side improvements and avoid adding dependencies or changing endpoints without a demonstrated need.

## REA and Android APK analysis

- Codex CLI has the REA MCP server registered as `rea` with `rea-agents@6.7.0`. If REA tools are missing from a session, restart Codex CLI; this file does not register MCP servers.
- The full development workspace may provide `../Orginal/in.etuwa.app_3.46.00.apk` as a behavioral reference. The APK and REA evidence are kept outside Git; use them only when present and authorized.
- For APK and DEX code, use REA's Android/JADX tools. Start with `inspect_android_package`, then use `search_android_classes`, `inspect_android_class`, `inspect_android_method`, and `trace_android_references` for the attendance screen and its data path.
- Trace attendance display from the screen entry point through state or model updates and data loading to the view or list rendering. Separate decompiled code facts from runtime behavior that has not been observed.
- Ghidra is configured as REA's native analysis provider. Use it for supported native binaries such as APK-contained `.so` libraries; use the Android/JADX tools for Java and DEX classes.
- The Codex REA server environment contains `GHIDRA_INSTALL_DIR`, `JAVA_HOME`, `REA_JADX_MCP_JAR`, and `REA_ANALYSIS_PROVIDER`. The Android CLI fallback below needs `JAVA_HOME` and `REA_JADX_MCP_JAR`. For native CLI analysis, also set `GHIDRA_INSTALL_DIR` to `$env:USERPROFILE\.local\share\rea\ghidra\ghidra_12.1.4_PUBLIC` and `REA_ANALYSIS_PROVIDER` to `ghidra`.

  ```powershell
  $env:JAVA_HOME = 'C:\Program Files\Java\jdk-25.0.5'
  $env:REA_JADX_MCP_JAR = Join-Path $env:USERPROFILE '.local\share\rea\android\jadx-headless-mcp-0.7.1-all.jar'
  npx.cmd -y rea-agents@6.7.0 inspect-android-package '..\Orginal\in.etuwa.app_3.46.00.apk' --json
  ```

## Git and repository boundaries

- This directory is the Git root for `https://github.com/ChristopherJoshy/NexusLabs.git`. Keep the workspace parent outside the repository.
- Commit only NexusLabs mobile app code and its required app-level documentation, build configuration, and CI. Do not commit workspace research, the Etlab APK, REA evidence, unrelated scripts, personal screenshots, or sibling workspace files.
- Before each commit, inspect `git status --short --untracked-files=all` and `git diff --cached --name-only`. Stage explicit paths and check that no credentials, tokens, local environment files, generated native projects, caches, dependencies, or build outputs are included.
- Commit every successfully completed update, including small and documentation-only changes, using a focused Conventional Commit message (`fix:`, `feat:`, `docs:`, `refactor:`, or `chore:`), then push to `origin/main` after the relevant checks pass.
- Never amend a published commit or force-push. If the remote has moved, preserve the local commit and reconcile the branch with a fast-forward or rebase before pushing.
