# lib — Rendering & Simulation Primitives

Low-level canvas/ticker/math/background utilities. No business logic.

## Structure

Five files, flat:

| File                   | Lines           | Role                                                                                          |
| ---------------------- | --------------- | --------------------------------------------------------------------------------------------- |
| `stage.ts`             | 321             | `Stage` class (canvas + dpr), `createTicker()` (RAF loop), global mouse/touch handlers        |
| `math.ts`              | 151             | `MyMath` namespace: dist/angle/splitVector/random/clamp/literalLattice (canvas text → points) |
| `backgroundManager.ts` | 172             | `createBackgroundManager()`: image/style bg apply, preload, cancel, status                    |
| `fscreen.ts`           | 42              | Fullscreen API wrapper (vendor prefixes)                                                      |
| `constants.ts`         | (in fireworks/) | Physics/color constants — see `../fireworks/constants.ts`                                     |

## Where to Look

| Task                           | Location                                           |
| ------------------------------ | -------------------------------------------------- |
| New visual effect (particles)  | `../fireworks/simulation.ts` (particle pools)      |
| Physics tuning (gravity, drag) | `math.ts` constants + `../fireworks/simulation.ts` |
| Canvas rendering order         | `stage.ts` `render` methods                        |
| Background image/style         | `backgroundManager.ts` `applyBackground()`         |
| Timing / frame budget          | `stage.ts` `createTicker()` (16.67ms target)       |
| Text → particle lattice        | `math.ts` `literalLattice()`                       |

## Conventions

- **Pure math**: `MyMath` has no side effects. All fns are `const` + arrow.
- **Single RAF owner**: Only `createTicker()` calls `requestAnimationFrame`. Consumers register listeners.
- **Canvas ownership**: `Stage` owns its `<canvas>`. Do not manipulate canvas outside `Stage` methods.
- **Particle lifecycle**: Handled in `../fireworks/simulation.ts` (`Star`/`Spark` pools).
- **Constants**: Physics/color in `../fireworks/constants.ts`.

## Anti-Patterns

- **NO** `Stage` instantiation in `math.ts` or `backgroundManager.ts` — coupling.
- **NO** hardcoded canvas dimensions — use `Stage.resize(w, h)`.
- **NO** `requestAnimationFrame` outside `createTicker()` — double loop = jank.
- **NO** `createTicker()` called twice — module guards but logs warning.
- **NO** module-level side effects in `stage.ts` (global mouse/touch handlers) — known issue.
