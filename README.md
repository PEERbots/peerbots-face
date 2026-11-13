# @peerbots/face

Canonical Peerbots Robot Face rendering engine, assets, viseme & amplitude synchronization, two-tier TTS audio caching, and modular Zustand state slices.

## Features

- **Dual Canonical Renderers + Pluggable Strategy (`FaceRendererStrategy`)**:
  - `PixiFaceView`: PixiJS v8 2D sprite & vector renderer (`Hugo`, `Simple`, `Robotic`, `Display`) with spritesheet emotions, natural blinking & breathing, smooth gaze interpolation, and amplitude-driven mouth shapes.
  - `VizijFaceView`: 3D WebAssembly skeletal & blendshape renderer (`Hugo - Expressive` and custom `.glb` uploads) powered by `@vizij/runtime-react`.
  - `StaticFaceFallback` & `FaceViewSkeleton`: Accessible ARIA-annotated fallback for headless browsers and WebGL-disabled environments with canonical sprite previews from `FaceAssets`.
- **Zero Backend Lock-In**: Zero Firebase, Firestore, or PubNub dependencies. Inject remote TTS (e.g., AWS Polly) via `SpeechSynthesizerAdapter` while built-in Web Speech API synthesis and `TtsAudioCache` (in-memory LRU + IndexedDB) handle caching and fallback automatically.
- **Modular Zustand Store Slices**: `createFaceRenderingSlice`, `createFaceSpeechSlice`, `createPeerbotsFaceStore`, `FaceStoreProvider`, and `useFaceStore`.

## Assets Setup

Copy or serve `node_modules/@peerbots/face/public/FaceAssets` at `/FaceAssets` in your application's public directory (or pass a custom `assetBaseUrl` to `createPeerbotsFaceStore({ assetBaseUrl })`).

## Development & CI

```bash
npm ci
npm run check:ci        # Typecheck, ESLint, Vitest coverage (>=80%), and Playwright Storybook WCAG 2.1 AA tests
npm run build           # Build ESM + CJS + DTS bundles to dist/
npm run build-storybook # Build static Storybook documentation
```

## Releases & Publishing (Changesets)

1. Record changes with `npm run changeset` and commit the generated `.changeset/*.md` file.
2. Pushing to `main` runs `.github/workflows/publish.yml`, which opens or updates the **"Version Packages"** pull request.
3. Merging **"Version Packages"** (with `NPM_TOKEN` configured in GitHub Actions secrets) builds `dist/` and publishes `@peerbots/face` to npm.
