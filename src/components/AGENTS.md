# components — UI Layer

UI layer for the firework simulator. Flat structure with Canvas subdir.

## Structure

One subdirectory + flat files:

| Dir/File | Role |
|----------|------|
| `Canvas/DualCanvas.tsx` | Two `<canvas>` layers (trails + main) + RAF ticker wiring |
| `Menu.tsx` | Settings panel (all form options, help modal trigger) |
| `Controls.tsx` | Top-bar buttons (pause, sound, menu, fullscreen) |
| `HelpModal.tsx` | Overlay dialog with categorized help content |
| `LoadingInit.tsx` | Loading spinner + status text |
| `SvgSprite.tsx` | Inline SVG symbol definitions (icons) |
| `testUtils.tsx` | Shared `renderWithStore()` for component tests |

## Where to Look

| Task | Location |
|------|----------|
| Add a new menu option | `Menu.tsx` + `appConfig.ts` selectors |
| Add a toolbar button | `Controls.tsx` |
| Change canvas rendering order | `Canvas/DualCanvas.tsx` |
| Add an icon | `SvgSprite.tsx` (symbol) + CSS `use` reference |
| Modify loading UX | `LoadingInit.tsx` |
| Write component test | Co-locate `*.test.tsx` + use `renderWithStore()` |

## Conventions

- **Props down, events up**: Components receive config via props, notify via callbacks (no direct store mutation).
- **Portal for overlays**: `HelpModal` renders via `fixed` positioning (not React portal).
- **Canvas ownership**: `DualCanvas` creates `Stage` instances; parent provides `onTickerReady` callback.
- **RequestAnimationFrame**: Single ticker from `createTicker()` shared by both stages.
- **Chinese UI strings**: Labels, errors, help text in Chinese. Tests assert exact strings.

## Anti-Patterns

- **NO** direct `store.setState()` in components — use callbacks from parent (`page.tsx`).
- **NO** `useEffect` for animation loops — use `DualCanvas.onTickerReady` + ticker listener.
- **NO** inline styles for canvas sizing — `Stage.resize()` handles dpr + CSS size.
- **NO** adding `className` logic that mashes tokens (e.g., `menu hide` → `menuhide`). Tests check `split(/\s+/)`.