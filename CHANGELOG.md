# @peerbots/face

## 0.4.1

### Patch Changes

- [#11](https://github.com/PEERbots/peerbots-face/pull/11) [`43b0efc`](https://github.com/PEERbots/peerbots-face/commit/43b0efc68d8d8c9a43606be96045a62646615f62) Thanks [@sbeleidy](https://github.com/sbeleidy)! - Fix two audio and fullscreen bugs:

  - Replace `SILENT_WAV_DATA_URI` with a genuine 16-bit signed PCM all-zero silent WAV (zero DC offset), mute the audio element during silent unlock priming, and defer `URL.revokeObjectURL` after `onended` to eliminate the audible tap/pop after speech finishes.
  - Match ancestor fullscreen elements in `useFullscreen`, exit native fullscreen in `toggleFullscreen` whenever a `fullscreenElement` is active, remove the duplicate `onPointerDown` handler on `<pixiGraphics>` in `FaceFullScreenButton` and `FaceScrollToTopButton`, and exit fullscreen before scrolling to top when clicking `FaceScrollToTopButton`.

## 0.4.0

### Minor Changes

- [#7](https://github.com/PEERbots/peerbots-face/pull/7) [`b4b6ecd`](https://github.com/PEERbots/peerbots-face/commit/b4b6ecd6b8d995221fd9e41e78cf29d15e43ad41) Thanks [@sbeleidy](https://github.com/sbeleidy)! - - Restore `variant="primary"` (Peerbots Teal) on the **Tap to Enable Sound** (`FaceAudioPrompt`) and **Allow Speech** (`CharacterSelectionControls`) buttons to match `app.peerbots.org` `main`.
  - Add a **Caption Style** setting (`captions.style`: `"pill"` | `"outline"`, defaulting to `"pill"`) in `FaceBehaviorControls` and `FaceCaption` so users can choose between the translucent dark pill backdrop and classic outlined caption text.

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
