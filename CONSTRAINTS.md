# Constraints

Last reviewed: 2026-11-11 by @sbeleidy

## Floor (always enforced, no setup required)

- No new suppression comments: `@ts-ignore`, `@ts-expect-error`, `eslint-disable`, `istanbul ignore`
- No unimplemented stubs: `throw new Error("Not implemented")`, empty `catch {}`
- No skipped or deleted tests without a reason in the commit message
- No secrets in source
- This file does not get weakened to make a change pass

## Enforced with numbers

| Dimension | Rule | Checked by | Runs at |
|-----------|------|-----------|---------|
| Types | Zero type errors | `npm run typecheck` | every edit |
| Lint | Zero errors from our config | `npm run lint` | every edit |
| Coverage | Line coverage ≥ 80% | `npm run test:coverage` | task end, CI |
| Accessibility | Zero critical or serious WCAG 2.1 AA violations | `npm test` (`vitest-axe`) & `npm run test:storybook` (`@storybook/addon-a11y`) | task end, CI |
| Build | Production & Storybook bundles compile cleanly | `npm run build && npm run build-storybook` | task end, CI |

## Exceptions

| ID | Rule | Path | Reason | Owner | Expires |
|----|------|------|--------|-------|---------|
