# PROJECT KNOWLEDGE BASE

**Generated:** 2026-08-28T15:45:00+08:00
**Commit:** abc1234
**Branch:** main

## OVERVIEW
Web-based firework simulator with real particle physics, 12 shell types, Web Audio, and custom backgrounds. Next.js 16 + React 19 + TypeScript 6 + Zustand 5 + Tailwind 4. Static export to GitHub Pages.

## STRUCTURE
```
pyro/
├── src/
│   ├── app/              # Next.js App Router (layout, page)
│   ├── components/       # React UI (Menu, Controls, Canvas, Modal)
│   ├── fireworks/        # Core physics engine (simulation, shells, audio, interaction)
│   ├── lib/              # Canvas/Stage/Ticker, math, background manager
│   ├── stores/           # Zustand store + React context
│   ├── config/           # Frozen app config + CSP
│   └── types/            # Shared TS types
├── public/               # Static assets (audio, fonts, images)
├── e2e/                  # Playwright smoke tests
├── .github/workflows/    # CI + deploy
└── out/                  # Static export output (gitignored)
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Add new shell type | `src/fireworks/shells.ts` | Add factory to `namedShellTypes` |
| Modify physics | `src/fireworks/simulation.ts` | `createSimulation` closure (see AGENTS.md there) |
| Change audio | `src/fireworks/audio.ts` | `SoundManagerDeps` + sources config |
| Add UI control | `src/components/Menu.tsx` | Form option + selector in `appConfig.ts` |
| Adjust store | `src/stores/fireworksStore.ts` | Config normalization + persist |
| Change CSP | `src/config/csp.ts` + `next.config.ts` | Meta tag in layout.tsx for static export |
| Run tests | `pnpm test` / `pnpm e2e` | Vitest (jsdom) + Playwright |

## CODE MAP
| Symbol | Type | Location | Refs | Role |
|--------|------|----------|------|------|
| `createSimulation` | fn | fireworks/simulation.ts | 4 | Physics engine factory (999 lines) |
| `Shell` | class | fireworks/simulation.ts | 12 | Shell instance, launch/burst |
| `launchShellFromConfig` | fn | fireworks/shells.ts | 4 | Launch helper (DI) |
| `startSequence` | fn | fireworks/shells.ts | 3 | Auto-launch orchestration |
| `createFireworksStore` | fn | stores/fireworksStore.ts | 3 | Zustand store + persist |
| `createInteraction` | fn | fireworks/interaction.ts | 2 | Input wiring |
| `createSoundManager` | fn | fireworks/audio.ts | 3 | Web Audio manager |
| `createBackgroundManager` | fn | lib/backgroundManager.ts | 2 | Background img/style mgr |
| `DualCanvas` | comp | components/Canvas/DualCanvas.tsx | 1 | Two canvas layers |
| `Stage` | class | lib/stage.ts | 8 | Canvas wrapper + dpr |

## CONVENTIONS
- **Path alias**: `@/*` → `./src/*` (tsconfig.json)
- **Client components**: `"use client"` at top (all components)
- **Store access**: `useFireworksStore()` hook (not direct import)
- **DI pattern**: Core modules take `Deps` object (no singletons)
- **Tests**: Co-located `*.test.ts(x)`, `@vitest-environment jsdom`, harness + mock ctx
- **Strict TS**: `strict: true`, `noUnusedLocals/Parameters`, `verbatimModuleSyntax`
- **Static export**: `output: "export"`, `basePath`/`assetPrefix` for GitHub Pages

## ANTI-PATTERNS (THIS PROJECT)
- **NO** `as any` / `@ts-ignore` / `@ts-expect-error` (strict mode enforced)
- **NO** module-level side effects (except `stage.ts` global input handlers — known issue)
- **NO** empty catch blocks — always handle or rethrow
- **NO** deleting failing tests to "pass"
- **NO** direct `localStorage` access outside `createAppStorage()`
- **NO** mutating frozen config (`fireworksAppConfig` is `Object.freeze()`)
- **NO** importing `simulation.Shell` outside `simulation.ts` (breaks encapsulation)

## UNIQUE STYLES
- **Lazy ref init**: `if (!ref.current) ref.current = ...` during render (ESLint `react-hooks/refs` disabled)
- **Frozen config**: `Object.freeze()` on all config objects + `as const` arrays
- **Chinese UI strings**: Tests assert Chinese labels directly
- **Class-token regression tests**: `className.split(/\s+/)` guards against mashed classes

## COMMANDS
```bash
pnpm dev              # Dev server (Turbopack)
pnpm build            # Static export to out/
pnpm lint             # ESLint flat config (max-warnings=0)
pnpm typecheck        # tsc --noEmit
pnpm test             # Vitest (unit + component)
pnpm test:coverage    # Vitest + v8 coverage
pnpm e2e              # Playwright (needs dev server)
pnpm format           # Prettier write
pnpm format:check     # Prettier check
```

## NOTES
- Real project root: `/home/spark/Projects/github/pyro/` (not the empty `Firework_Simulator/` sibling)
- CSP: Static export can't send headers → `<meta httpEquiv="Content-Security-Policy">` in layout.tsx
- Audio files: `public/audio/*.mp3` served from `/audio/` at runtime
- Codegraph DB: `/home/spark/.omo/codegraph/projects/Firework_Simulator-63a1b4dfa5048ead/codegraph.db`

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
