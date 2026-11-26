---
"@peerbots/face": patch
---

Declare `"sideEffects": ["**/*.css"]` in `package.json` so bundlers can tree-shake unused exports when consumers import lightweight helpers or types from `@peerbots/face`.
