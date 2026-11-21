---
"@peerbots/face": minor
---

Add cross-browser / iPhone Safari fullscreen support (`useFullscreen`, `FaceFullscreenContext`, CSS pseudo-fullscreen fallback in `FaceView` and `FaceFullScreenButton`) and Mobile Safari audio reliability (`AudioManager` singleton with persistent `HTMLAudioElement` and user-gesture `unlock()`, iOS / suspended `AudioContext` bypass in `AudioAnalyzer`, `NotAllowedError` recovery and `unlockAudio()` in `faceSpeechSlice`, and removing whitespace `SpeechSynthesisUtterance(" ")` priming in `FaceAudioPrompt` and `CharacterSelectionControls`).
