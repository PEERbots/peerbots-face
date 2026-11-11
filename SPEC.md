# Spec: Peerbots Face Engine (`@peerbots/face`)

## 1. Objective

Provide the canonical, standalone, framework-clean Peerbots Robot Face rendering engine, asset bundle (`public/FaceAssets`), viseme & amplitude synchronization pipeline, TTS audio caching layer, and modular Zustand state slices so that `app.peerbots.org` (`peerbots-controller-web`), `constrained-face-agent` (`peerbots-agent`), and future Peerbots web applications share a single source of truth for Peerbots characters.

## 2. Core Architectural Principles

1. **Zero Backend / Realtime Lock-In**: `@peerbots/face` has **zero** dependencies on Firebase, Firestore, PubNub, or AWS SDKs. Remote speech synthesis (such as AWS Polly) and realtime call channels are injected by host applications via clean TypeScript interfaces (`SpeechSynthesizerAdapter`).
2. **Canonical Dual Rendering Engine + Accessible Headless Fallback**:
   - **2D Sprite & Vector Renderer (`PixiFaceView`)**: Powered by PixiJS v8 (`@pixi/react`), rendering canonical Peerbots characters (`Hugo`, `Simple`, `Robotic`, `Display`) with spritesheet eye emotions, breathing/blinking loops, smooth gaze interpolation, ambient radial glow, smooth background color transitions, and amplitude-synchronized mouth shapes (`Hugo`, `Ellipse`, `ZigZag`, `Beak`).
   - **3D WebAssembly Rig Renderer (`VizijFaceView`)**: Powered by `@vizij/runtime-react`, rendering `Hugo - Expressive` and custom `.glb` rigs with blendshape emotions, timed Polly visemes, and scene transforms.
   - **Pluggable Strategy (`FaceRendererStrategy` & `FaceRendererRegistry`)**: Host applications can register custom face renderers without modifying `FaceView`.
   - **Accessible Static Fallback (`StaticFaceFallback` & `FaceViewSkeleton`)**: Automatically rendered in headless test environments (`navigator.webdriver`, `__VITEST_BROWSER__`, `jsdom`) or when WebGL is unavailable, exposing semantic ARIA status/emotion/color attributes and optional canonical sprite previews from `FaceAssets` (never non-canonical geometric SVG approximations).
3. **Modular Zustand Store Slices**:
   - `faceRenderingSlice.ts`: Avatar selection (`selectedFace`), visual/positioning transforms (`zoom`, `offset`, `rotation`, `autoRotate`, `captions`, `pixiSettings`, `vizijSettings`), normalized eye `gaze` (`[-1, 1]`), and configurable `assetBaseUrl`.
   - `faceSpeechSlice.ts`: Active `lastMessage`, `isSpeaking`, `speechAllowed`, voice selection (`selectedVoiceUri`, `availableVoices`), viseme/amplitude playback state, `interrupt` vs. `queue` speech modes, `express(message, options)`, and `stopSpeech()`.
   - `createPeerbotsFaceStore(options)` + `FaceStoreProvider` & `useFaceStore` (`FaceStoreContext.tsx`).
4. **Two-Tier TTS Audio Cache (`TtsAudioCache`)**:
   - Caches synthesized audio `Blob`s, viseme marks, and amplitude envelopes in an in-memory LRU map backed by IndexedDB (`peerbots-tts-cache`), keyed by `voiceId:engine:text` (plus rate/pitch when customized), minting fresh object URLs per playback.

## 3. Commands

```bash
npm run build            # Bundle ESM, CJS, and .d.ts via tsup
npm run typecheck        # Strict TypeScript check (tsc --noEmit)
npm run lint             # ESLint check
npm test                 # Unit & vitest-axe accessibility tests
npm run test:coverage    # Unit tests with >= 80% line coverage gate
npm run storybook        # Launch Storybook 10 dev server
npm run build-storybook  # Build static Storybook bundle
```
