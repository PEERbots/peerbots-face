---
"@peerbots/face": minor
---

- Add `FaceTester`, `AmplitudeGraph`, `setGlobalFaceStore`, and Pixi subcomponent exports (`Eyes`, `Mouth`, `EllipseMouth`, `ZigZagMouth`, `HugoMouth`, `BeakMouth`) for parity with `app.peerbots.org`.
- Bundle self-contained Tailwind CSS v4 styles (`prefix(pbf)` injected via `tsup` `injectStyle`) and prefix internal component classes with `pbf:` so host apps (like `app.peerbots.org` and `constrained-face-agent`) no longer require `@source` workarounds to compile `@peerbots/face` styles.
- Upgrade `playwright` to `^1.65.1` and `@peerbots/core` devDependency to `^1.4.3`.
