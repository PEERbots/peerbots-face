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
