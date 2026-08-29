# Contributing to Pyro 🎆

Thanks for taking the time to contribute! Pyro is a static web-based firework simulator and we welcome all kinds of contributions — bug fixes, new shell types, UX polish, translations, docs improvements, or simply filing well-researched issues.

The following is a set of guidelines for contributing. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

---

## I have a question

> **Note:** Please don't file an issue for support questions. Instead, reach out by starting a [Discussion](https://github.com/NianBroken/Firework_Simulator/discussions) or checking the [FAQ in README](./README.md#-faq).

---

## What should I know before I get started?

### Tech stack at a glance

| Area          | Stack                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------- |
| Framework     | Next.js 16 (App Router, static export) + React 19                                           |
| Language      | TypeScript 6 — strict mode, `verbatimModuleSyntax`, `noUnusedLocals` / `noUnusedParameters` |
| State         | Zustand 5 with `persist` + versioned schema migration                                       |
| Styling       | Tailwind CSS 4 via PostCSS                                                                  |
| Rendering     | Two `<canvas>` layers (trails + main) driven by a single `requestAnimationFrame` ticker     |
| Audio         | Web Audio API — preloaded mp3 buffers, randomised pitch & volume                            |
| Tests         | Vitest (unit + component, jsdom) + Playwright (e2e smoke)                                   |
| Lint / Format | ESLint 9 (`eslint-config-next`) + Prettier with Tailwind plugin                             |

### Architecture overview

There is a short [ARCHITECTURE.md](./docs/ARCHITECTURE.md) and two ADRs under [`docs/ADR/`](./docs/ADR/) that explain the core decisions (physics centralization, shell runtime state).

Each module also has an `AGENTS.md` in its directory that describes its role, conventions, and anti-patterns specific to that module. They're written for AI agents but human contributors will find them just as useful.

### Dependency injection

Most core modules use the `createXxx(deps)` factory pattern. There are no module-level singletons for simulation-owned state (with the known exception of the particle pools in `src/fireworks/particles/pools.ts`, which are intentionally global to avoid GC pauses).

Before adding a new global, read `docs/ADR/0001-physics-centralization.md` — the bar for new module-level mutable state is very high.

---

## How can I contribute?

### 🐞 Report bugs

If you find a bug, please open an issue using the **Bug report** template and include as much detail as you can:

- Exact steps to reproduce
- What you expected to happen vs. what actually happened
- Screenshots / GIFs if the bug is visual
- Environment:
  - Browser + version (e.g. Chrome 145.0)
  - Device (desktop / mobile, OS, screen size)
  - The selected Quality level and Shell size in the menu
- URL hash / localStorage snapshot if the issue is about persisted state

### ✨ Suggest features / enhancements

Feature requests are welcome. Please use the **Feature request** issue template and explain:

1. What problem does it solve?
2. Why should it be in the core project vs. a fork?
3. What's the expected UX flow?

### 🛠️ Pull requests

All non-trivial changes should have an associated issue first — even if it's just a one-liner like "Shell X produces invisible sparks on Safari". That keeps PR reviews focused on the _what_ and the _why_, not just the _how_.

#### Typical PR flow

1. Fork the repo and create your branch from `main`.
2. Install dependencies with `pnpm install` (requires Node ≥ 20, pnpm ≥ 9 — see [`package.json`](./package.json) engines).
3. Make your change. If it's code:
   - Co-locate tests next to the source: `foo.ts` gets `foo.test.ts(x)`.
   - Keep shell physics constants exact unless the bug is in the constant itself (see `src/fireworks/AGENTS.md`).
   - No `as any`, no `@ts-ignore`, no `@ts-expect-error` (strict mode is enforced by both ESLint and `tsc`).
   - No empty `catch {}` blocks — rethrow or at least `console.warn` so failures are observable.
4. Run the full verification suite locally **before** pushing:
   ```bash
   pnpm format:check   # prettier, warn + fail on mismatch
   pnpm lint           # eslint, --max-warnings=0
   pnpm typecheck      # tsc --noEmit
   pnpm test --run     # vitest (no watch mode, all green required)
   pnpm build          # static export to out/ must succeed
   ```
   E2E (`pnpm e2e`) requires Playwright browsers (`pnpm exec playwright install --with-deps chromium`) and a running dev server, so it's fine to let CI run it if you don't have chromium handy locally. Just note it in the PR body.
5. Push your branch to your fork and open a PR. Use the PR checklist in `.github/pull_request_template.md` to confirm you ran the local checks.
6. If CI is red, fix it. The project treats ESLint warnings as errors and `typecheck` failures as blockers.

#### What makes a good PR

- **Small and focused.** One bug fix or feature per PR. If your change touches 15 files for different reasons, split it.
- **Tests for the new behavior.** Bug fixes should include a failing test first (that your change makes pass). Features should cover their public API surface.
- **Benchmark a before/after if the change touches the render loop or physics update.** Even a hand-counted `console.time` in the browser devtools is better than nothing.
- **Mentions the fixed issue in the PR body** (e.g. `Fixes #123`) so GitHub auto-closes it on merge.

---

## Style & conventions

### Commit messages

No strict convention (we don't run semantic-release yet), but please follow the pattern:

```
<area>: short summary in imperative mood

Longer body explaining why this change was needed, what alternatives were
considered, and any trade-offs made.

Closes #123.
```

Examples of `<area>`: `shells`, `sim`, `audio`, `menu`, `docs`, `ci`, `chore`.

### Code style

We use Prettier + Tailwind plugin. Run `pnpm format` before committing if `pnpm format:check` is complaining. ESLint enforces everything else.

A few project-specific rules to remember (from each module's `AGENTS.md`):

- **No direct `localStorage` access outside `createAppStorage()`** — go through the Zustand persist middleware.
- **Don't mutate frozen config** — `fireworksAppConfig` in `src/config/appConfig.ts` is `Object.freeze()`'d. New defaults go there (in source), not via runtime patching.
- **Don't import `simulation.Shell` outside `simulation.ts`** — the `Shell` class is intentionally encapsulated in its closure. Use `SimulationDeps.Shell` constructor or shell factory functions in `shells.ts`.
- **Client components need `"use client"`** at the top. We're on the Next.js App Router.
- **React refs are lazy-initialized in render** (`if (!ref.current) ref.current = ...`). The `react-hooks/refs` ESLint rule is disabled for this pattern — do not move the init into `useEffect` without measuring a perf regression first.

---

## Translations (i18n)

Currently we have two READMEs: English (`README.md`) and Simplified Chinese (`README.zh-CN.md`). Any content change to one README must be mirrored in the other. The PR checklist in the template has an explicit checkbox for this.

Full runtime i18n of the in-game menu (Chinese labels) is on the Roadmap — see the README if you'd like to lead that work.

---

## Community

- Be kind. We have a [Code of Conduct](./CODE_OF_CONDUCT.md) based on Contributor Covenant v2.1.
- If a maintainer asks you to "rebase" your PR, they typically mean: reapply your commits on top of the latest `main` so the diff is clean. `git rebase main` in your branch + force-push usually does it.
- Reviews can take a few days — this is a personal project, not a full-time job. If it's been a week and you haven't heard back, feel free to ping the thread.

Again, thank you for your interest in making Pyro better. 🎇
