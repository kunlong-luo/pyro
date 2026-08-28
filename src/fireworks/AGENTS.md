# fireworks — Core Physics Domain

Particle simulation engine. TypeScript 1:1 port of original JS. Closure-based factories, no global mutable state (mostly). 17 files, ~3400 lines.

## Structure

No subdirectories. Flat module with clear responsibility boundaries:

| File             | Lines | Role                                                     |
| ---------------- | ----- | -------------------------------------------------------- |
| `simulation.ts`  | 1156  | Physics engine, particle pools, Shell class, render loop |
| `shells.ts`      | 717   | Shell factories, selection helpers, launch sequences     |
| `audio.ts`       | 260   | Web Audio API manager, sound preload/playback            |
| `interaction.ts` | 258   | Pointer/keyboard handlers, speed control                 |
| `background.ts`  | 136   | Background resolution fallback chain                     |
| `constants.ts`   | 74    | Colors, physics constants, derived arrays                |
| `wordBurst.ts`   | 69    | Word-burst timing tracker                                |
| `selectors.ts`   | 52    | State selectors (pure functions)                         |
| `device.ts`      | 49    | Viewport detection, scale factor                         |

## Where to Look

**Adding a new shell type?**
→ `shells.ts`: Add factory function, register in `namedShellTypes`, add to `shellNames`.

**Changing particle behavior (gravity, drag, spark)?**
→ `simulation.ts`: Pools at lines 190-320, physics in `update()` at line 1026.

**Modifying burst effects (crossette, floral, crackle)?**
→ `simulation.ts`: Effect functions at lines 460-519.

**Adjusting launch sequences (pyramid, barrage)?**
→ `shells.ts`: Sequence functions at lines 513-717.

**Changing sound playback?**
→ `audio.ts`: `playSound()` at line 218, sources config at line 50.

**Altering user input handling?**
→ `interaction.ts`: Pointer at line 108, keyboard at line 162.

**Modifying quality/device thresholds?**
→ `device.ts`: Viewport breakpoints at lines 12-33.

## Conventions

- **Factory pattern**: `createXxx(deps)` returns closure-scoped API. All deps injected via interfaces.
- **Magic numbers preserved**: Original JS values kept exactly. Do not "clean up" physics constants.
- **Pool pattern**: `Star`, `Spark`, `BurstFlash` use `_pool` + `active` arrays. Always `returnInstance()` after use.
- **Selector functions**: Pure, accept `FireworksState` explicitly. No hidden store access.
- **Chinese error messages**: Runtime errors use Chinese text (e.g., `"无效的烟花颜色配置"`).
- **1:1 port fidelity**: Comments say "ported from js/fireworks/X.js". Changes require justification.

## Anti-PATTERNS

**God module**: `simulation.ts` (1156 lines) contains Shell class, three particle pools, five effect functions, render loop, and sky coloring. Extract if adding new particle types.

**Mutable module state in shells.ts**: `lastColor`, `isFirstSeq`, `currentFinaleCount` are module-level. Breaks if multiple simulation instances needed.

**Object.assign in Shell constructor** (line 555): Fragile. Adding a field to `SimulationShellOptions` silently overwrites Shell class properties.

**No type narrowing on color**: `this.color` is `string | string[]` checked via `typeof`/`Array.isArray`. Pattern matches could be cleaner.

**Effect coupling**: Effects (`crossetteEffect`, `floralEffect`, etc.) call `Star.add()` and `BurstFlash.add()` directly on closure-scoped pools. Not testable in isolation.
