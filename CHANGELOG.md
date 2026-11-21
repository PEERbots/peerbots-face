# @peerbots/face

## 0.3.0

### Minor Changes

- [#5](https://github.com/PEERbots/peerbots-face/pull/5) [`34d2986`](https://github.com/PEERbots/peerbots-face/commit/34d2986f6d145ba17da8188fad8ad427ac00e4b7) Thanks [@sbeleidy](https://github.com/sbeleidy)! - Add cross-browser / iPhone Safari fullscreen support (`useFullscreen`, `FaceFullscreenContext`, CSS pseudo-fullscreen fallback in `FaceView` and `FaceFullScreenButton`) and Mobile Safari audio reliability (`AudioManager` singleton with persistent `HTMLAudioElement` and user-gesture `unlock()`, iOS / suspended `AudioContext` bypass in `AudioAnalyzer`, `NotAllowedError` recovery and `unlockAudio()` in `faceSpeechSlice`, and removing whitespace `SpeechSynthesisUtterance(" ")` priming in `FaceAudioPrompt` and `CharacterSelectionControls`).

## 0.2.0

### Minor Changes

- [#2](https://github.com/PEERbots/peerbots-face/pull/2) [`6c4ad13`](https://github.com/PEERbots/peerbots-face/commit/6c4ad13034da60815dd19420da2dde06c4b9156b) Thanks [@sbeleidy](https://github.com/sbeleidy)! - - Add `FaceTester`, `AmplitudeGraph`, `setGlobalFaceStore`, and Pixi subcomponent exports (`Eyes`, `Mouth`, `EllipseMouth`, `ZigZagMouth`, `HugoMouth`, `BeakMouth`) for parity with `app.peerbots.org`.
  - Bundle self-contained Tailwind CSS v4 styles (`prefix(pbf)` injected via `tsup` `injectStyle`) and prefix internal component classes with `pbf:` so host apps (like `app.peerbots.org` and `constrained-face-agent`) no longer require `@source` workarounds to compile `@peerbots/face` styles.
  - Upgrade `playwright` to `^1.65.1` and `@peerbots/core` devDependency to `^1.4.3`.

## 0.1.0

### Minor Changes

- [`037d619`](https://github.com/PEERbots/peerbots-face/commit/037d619b730f37134bed0c7ae44f6633b6de8295) Thanks [@sbeleidy](https://github.com/sbeleidy)! - Initial release of `@peerbots/face` (`0.1.0`) providing dual PixiJS v8 2D and Vizij 3D robot face renderers, canonical `FaceAssets`, accessible `StaticFaceFallback`, modular Zustand rendering and speech slices, two-tier `TtsAudioCache` (in-memory LRU + IndexedDB), and `FaceSettingsPanel` controls.
