---
"@peerbots/face": patch
---

Fix two audio and fullscreen bugs:

- Replace `SILENT_WAV_DATA_URI` with a genuine 16-bit signed PCM all-zero silent WAV (zero DC offset), mute the audio element during silent unlock priming, and defer `URL.revokeObjectURL` after `onended` to eliminate the audible tap/pop after speech finishes.
- Match ancestor fullscreen elements in `useFullscreen`, exit native fullscreen in `toggleFullscreen` whenever a `fullscreenElement` is active, remove the duplicate `onPointerDown` handler on `<pixiGraphics>` in `FaceFullScreenButton` and `FaceScrollToTopButton`, and exit fullscreen before scrolling to top when clicking `FaceScrollToTopButton`.
