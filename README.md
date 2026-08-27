<div align="center">

# Pyro

**A web-based firework simulator with realistic particle physics.**

Real 2D particle physics, 12 shell types, Web Audio, custom backgrounds — built with Next.js, React, and TypeScript.

![License](https://img.shields.io/badge/license-Apache--2.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6)

<img src="./public/images/favicon.png" alt="Pyro icon" width="96" />

[中文文档](./README.zh-CN.md)

</div>

<img src="./Image_Preview.png" alt="Pyro preview" width="640" />

## Live Demo

**https://nianbroken.github.io/Firework_Simulator/**

> The demo URL still uses this project's original repo name — see [Deployment](#deployment) for why.

## Features

- **12 shell types** — Chrysanthemum, Ghost, Strobe, Palm, Ring, Crossette, Floral, Falling Leaves, Willow, Crackle, Horse Tail, Random — plus 6 auto-launch sequences, including a 32-shot finale
- **Dual-canvas rendering** (`mix-blend-mode: lighten`, long-exposure trails) with dynamic sky lighting
- **Web Audio** with randomized pitch/volume and 20ms burst throttling
- **Text fireworks** via point-lattice word bursts, with custom backgrounds (image / gradient / CSS)
- Fullscreen mode, automatic quality detection (`navigator.hardwareConcurrency`), responsive down to mobile
- Persisted settings (Zustand + versioned migration), zero backend — fully static

## Tech Stack

|           |                                                       |
| --------- | ----------------------------------------------------- |
| Framework | Next.js 16 (App Router, Turbopack, static export)     |
| UI        | React 19 + TypeScript 6 (strict) + Tailwind CSS 4     |
| State     | Zustand 5 (persisted, schema-migrated)                |
| Rendering | Canvas 2D + Web Audio API                             |
| Tooling   | ESLint 9 (`eslint-config-next`) + Prettier + Vitest 4 |

## Quick Start

```bash
pnpm install
pnpm dev             # dev server at localhost:3000
pnpm build            # static export -> out/
pnpm start            # serve a production build

pnpm lint              # eslint
pnpm typecheck         # tsc --noEmit
pnpm format:check      # prettier --check
pnpm test              # vitest
pnpm test:coverage     # vitest run --coverage
```

Requires Node 20+ and pnpm 9+.

## Project Structure

```
src/
  app/                        # Next.js App Router entry
    layout.tsx / page.tsx / globals.css
  config/appConfig.ts         # frozen defaults (words, backgrounds, quality)
  types/app.ts                # QualityLevel, Selectors, HelpContent...
  stores/fireworksStore.ts    # Zustand store + normalization/migration
  lib/
    math.ts                   # MyMath
    stage.ts                  # Stage + Ticker (DPR, clamp [17,68], 500ms touch)
    fscreen.ts                # fullscreen polyfill
    backgroundManager.ts      # fetch vs Image, requestId dedup
  fireworks/
    constants.ts               # GRAVITY, COLOR, PI_2...
    device.ts                  # IS_MOBILE/DESKTOP/HEADER
    selectors.ts                # state selectors
    wordBurst.ts                # every-5 tracker
    shells.ts                   # 12 shell factories (+ quality param)
    simulation.ts                # Shell/Star/Spark/BurstFlash pools + physics
    audio.ts                     # SoundManager factory
    interaction.ts               # pointer/key/resize/speed bar
    background.ts                # fallback chain
  components/
    Canvas/DualCanvas.tsx
    Controls.tsx / Menu.tsx / HelpModal.tsx / LoadingInit.tsx / SvgSprite.tsx
public/
  audio/  fonts/  images/  favicon.png
```

## Configuration

All defaults live in `src/config/appConfig.ts`:

```ts
defaultWords: ["新年快乐", "平安喜乐", "万事顺意"]
defaultBackground: { mode: "none", value: "" } // "image" -> URL, "style" -> linear-gradient(...)
wordFontFamily: "Gabriola,华文琥珀"
qualityLevels: { low: 1, normal: 2, high: 3 }
scaleFactorOptions: [0.5, 0.62, 0.75, 0.9, 1.0, 1.5, 2.0]
```

Runtime overrides persist to `localStorage`:

- `src/stores/fireworksStore.ts` (`buildDefaultConfig`) — quality auto-detect, `isDesktop ? size 3 : 2`
- Background resolution: `src/lib/backgroundManager.ts` + `src/fireworks/background.ts`, fallback chain `user → code default → none`

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the module graph, physics model, and rendering pipeline (Chinese).

## Deployment

Static export only (`output: "export"` in `next.config.ts`) — `pnpm build` emits `out/`, deployable to any static host (GitHub Pages, Vercel, Nginx). HTTPS is recommended for Audio/Fullscreen APIs.

The production `basePath`/`assetPrefix` are still `/Firework_Simulator`, matching this repo's actual (unchanged) name and GitHub Pages path — only the project's display name and package name were rebranded to Pyro, not the repository itself.

## License

`Copyright © 2022 NianBroken. All rights reserved.`

Licensed under [Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0).

## Credits

- [Firework Simulator v2](https://codepen.io/MillerTime/pen/XgpNwb) by MillerTime
- [haodong108/fireworks-2023](https://gitee.com/haodong108/fireworks-2023)

Issues and PRs welcome.
