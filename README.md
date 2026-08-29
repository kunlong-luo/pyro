<div align="center">

<img src="./public/images/favicon.png" alt="Pyro icon" width="120" />

# 🎆 Pyro

**Web-based firework simulator with realistic 2D particle physics.**

12 shell types · Web Audio SFX · custom backgrounds · text word-bursts · auto-launch sequences — all static, zero backend.

<p>
  <a href="https://nianbroken.github.io/Firework_Simulator/">
    <img src="https://img.shields.io/badge/🚀_Live_Demo-GitHub_Pages-2ea44f?style=for-the-badge" alt="Live Demo">
  </a>
  <a href="./LICENSE">
    <img src="https://img.shields.io/badge/License-Apache--2.0-blue?style=for-the-badge" alt="License">
  </a>
</p>

<p>
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white" alt="Next.js 16">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white" alt="TypeScript 6">
  <img src="https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind 4">
  <img src="https://img.shields.io/badge/Zustand-5-5850EC" alt="Zustand 5">
</p>

<p>
  <img src="https://img.shields.io/github/actions/workflow/status/NianBroken/Firework_Simulator/ci.yml?branch=main&label=CI" alt="CI Status">
  <img src="https://img.shields.io/github/actions/workflow/status/NianBroken/Firework_Simulator/deploy.yml?branch=main&label=Deploy" alt="Deploy Status">
  <img src="https://img.shields.io/badge/Tests-329_passed-green" alt="Tests: 329 passed">
  <img src="https://img.shields.io/badge/coverage-~95%25-green" alt="Coverage: ~95%">
</p>

<p>
  <a href="./README.zh-CN.md">🇨🇳 中文文档</a>
  ·
  <a href="https://github.com/NianBroken/Firework_Simulator/discussions">💬 Discussions</a>
  ·
  <a href="./CONTRIBUTING.md">🤝 Contributing</a>
</p>

</div>

---

## 👀 Preview

> 👇 **Click the banner above to open the live demo.** The real thing is much more immersive than a static image — click anywhere to launch a firework, enable **Finale mode** for the 32-shot barrage.

<!-- TODO (after you record): Replace the static PNG below with a GIF / MP4 of Finale mode.
     Recommended (smallest file): <video src="..." autoplay loop muted playsinline width="800"></video>
     Alternative: <img src="./docs/screenshots/finale.gif" alt="Finale mode demo" width="800"> -->

<img src="./Image_Preview.png" alt="Pyro in action" width="800" />

### Shell gallery

<!-- TODO (after you take screenshots): Replace each placeholder image path. -->
<!-- Screenshot tip: Hide controls + enable long-exposure mode for cleanest look. -->

<div align="center">
<table>
  <tr>
    <td width="50%">
      <img src="./Image_Preview.png" alt="Chrysanthemum Shell" width="100%" /><br />
      🌸 Chrysanthemum — classic burst
    </td>
    <td width="50%">
      <img src="./Image_Preview.png" alt="Ring Shell" width="100%" /><br />
      💍 Ring — perfect circle
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="./Image_Preview.png" alt="Word Burst" width="100%" /><br />
      🀄 Word Burst — lattice text fireworks
    </td>
    <td width="50%">
      <img src="./Image_Preview.png" alt="Custom Background + Long Exposure" width="100%" /><br />
      🌌 Custom background + long exposure
    </td>
  </tr>
</table>
</div>

---

## 🎮 How to Play

| Action                                         | Effect                                                            |
| ---------------------------------------------- | ----------------------------------------------------------------- |
| 🖱️ **Left-click / tap anywhere**               | Launch one shell of the currently selected type at that position  |
| ⌨️ **Space bar**                               | Pause / resume the simulation                                     |
| ⌨️ **M key**                                   | Toggle the settings menu                                          |
| ⏸️ **Top-left button**                         | Pause button                                                      |
| 🔊 **Top-center button**                       | Sound on / off                                                    |
| ⚙️ **Top-right button**                        | Open the full settings menu                                       |
| 🎚️ **Bottom edge — click & drag horizontally** | Adjust simulation speed from 0.25× to 1× (blue speed bar appears) |
| ☑️ Menu → **Fullscreen**                       | Enter browser fullscreen mode                                     |

> 💡 **Tips:**
>
> - Enable **Word Burst** — every 5th shell explodes into 新年快乐 / 平安喜乐 / 万事顺意
> - Enable **Finale mode** for a non-stop 32-shell rapid-fire barrage
> - **Long exposure mode** keeps the trails forever fading in — great for wallpaper screenshots

---

## ✨ Features

- **12 shell types** — Chrysanthemum, Ghost, Strobe, Palm, Ring, Crossette, Floral, Falling Leaves, Willow, Crackle, Horse Tail, Random — plus 6 auto-launch sequences (incl. a 32-shot finale)
- **Dual-canvas rendering** with `mix-blend-mode: lighten` + real long-exposure trails + **dynamic sky lighting** that illuminates the background on every burst
- **Web Audio engine** — preloaded mp3 buffers, randomized pitch & volume, 20 ms micro-burst throttling, and separate lift / burst / crackle channels
- **Text (word-burst) fireworks** — Chinese text rasterized to a particle lattice on the fly, configurable font & density
- **Custom backgrounds** — image URL, `url(...)`, or any CSS image syntax (`linear-gradient(...)`, `radial-gradient(...)`, `image-set(...)`)
- **Automatic quality detection** based on `navigator.hardwareConcurrency`, with manual override (Low / Normal / High)
- **Responsive** — works on mobile down to 375 px wide, with touch-first input and DPR-aware canvas scaling
- **Persisted settings** via Zustand with **versioned schema migration** (old 1.x and 2.x localStorage configs are automatically normalised on load)
- **Zero backend** — pure static export, hosts anywhere (GitHub Pages, Vercel, Nginx)

---

## 🧰 Tech Stack

| Layer         | Details                                                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Framework** | Next.js 16 (App Router, Turbopack, static export `output: "export"`)                                                                       |
| **UI**        | React 19 + TypeScript 6 (`strict`, `verbatimModuleSyntax`, `noUnusedLocals`) + Tailwind CSS 4                                              |
| **State**     | Zustand 5 with `persist` middleware, custom `PersistStorage` adapter, multi-version migration pipeline                                     |
| **Rendering** | Canvas 2D × 2 layers (trails + main), single `requestAnimationFrame` Ticker, DPR-aware `Stage` wrapper                                     |
| **Audio**     | Web Audio API, AudioBuffer preload, gain + playbackRate randomization per sound                                                            |
| **Tests**     | Vitest 4 (`jsdom`) with `@testing-library/react` + `@testing-library/user-event`, Playwright E2E smoke suite, size-limit for bundle budget |
| **Tooling**   | ESLint 9 (`eslint-config-next` + `typescript-eslint` flat config, `--max-warnings=0`), Prettier with Tailwind plugin                       |

---

## 🚀 Quick Start

Requires **Node ≥ 20** and **pnpm ≥ 9**.

```bash
# Install dependencies
pnpm install

# Local dev server (localhost:3000)
pnpm dev

# Build static export -> out/ (deployable to any static host)
pnpm build

# Serve the production build locally
pnpm start

# -------- Code quality --------
pnpm lint              # ESLint, max warnings = 0
pnpm typecheck         # tsc --noEmit
pnpm format            # Prettier write
pnpm format:check      # Prettier check (used in CI)

# -------- Tests -------------
pnpm test              # Vitest (watch mode)
pnpm test --run        # Vitest (single run, used in CI)
pnpm test:coverage     # Vitest + v8 coverage report
pnpm e2e               # Playwright E2E (needs dev server running on 3000 first)
pnpm size              # Size-limit: asserts bundle < 400 kB gzipped
```

---

## 📁 Project Structure

```
pyro/
├── src/
│   ├── app/                         # Next.js App Router entry
│   │   ├── layout.tsx               # CSP meta tag, fonts, HTML shell
│   │   ├── page.tsx                 # Root component — wires store + canvas + UI
│   │   ├── useFireworksSimulator.ts # Main React hook that wires the engine
│   │   ├── globals.css              # Tailwind directives + legacy CSS port
│   │   └── error.tsx / global-error.tsx
│   ├── components/                  # React UI layer (no business logic)
│   │   ├── Canvas/DualCanvas.tsx    # Two <canvas> layers + Ticker + pointer wiring
│   │   ├── Controls.tsx             # Top bar (pause / sound / menu / fullscreen)
│   │   ├── Menu.tsx                 # Settings menu (all form options + help triggers)
│   │   ├── HelpModal.tsx            # Help overlay dialog
│   │   ├── LoadingInit.tsx          # Initial loading spinner
│   │   └── SvgSprite.tsx            # Inline SVG icon symbols
│   ├── fireworks/                   # Core physics & rendering domain (no React)
│   │   ├── simulation.ts            # Shell class, burst logic, update loop, pools
│   │   ├── shells.ts                # 12 shell factories + sequences + selectors
│   │   ├── particles/pools.ts       # Star / Spark / BurstFlash object pools
│   │   ├── particles/effects.ts     # Crossette / Floral / Crackle / FallingLeaves
│   │   ├── render/render.ts         # Canvas draw for all particle types
│   │   ├── audio.ts                 # Web Audio manager (preload + play)
│   │   ├── interaction.ts           # Pointer + key input, speed bar, auto-launch
│   │   ├── skyLighting.ts           # Dynamic background lighting on burst
│   │   ├── wordBurst.ts             # Every-N word-burst timing tracker
│   │   ├── device.ts                # IS_DESKTOP / IS_HEADER / default scale
│   │   ├── constants.ts             # GRAVITY, COLOR, COLOR_CODES, PI_2…
│   │   └── selectors.ts             # Pure state → derived-value selectors
│   ├── stores/                      # Zustand
│   │   ├── fireworksStore.ts        # createFireworksStore + normalize + migration
│   │   └── storeContext.tsx         # React context provider for the store
│   ├── lib/                         # Low-level primitives
│   │   ├── stage.ts                 # Stage (canvas + DPR) + createTicker (RAF loop)
│   │   ├── math.ts                  # MyMath namespace: dist / angle / clamp / literalLattice
│   │   ├── fscreen.ts               # Vendor-prefixed Fullscreen API polyfill wrapper
│   │   └── backgroundManager.ts     # Background apply / preload / race-condition guard
│   ├── config/
│   │   ├── appConfig.ts             # Frozen defaults (words, backgrounds, UI strings)
│   │   ├── physics.ts               # All tunable physics constants (BURST / LAUNCH / …)
│   │   └── csp.ts                   # Content-Security-Policy header string
│   └── types/app.ts                 # Shared TS types: QualityLevel, HelpContent, Selectors…
├── docs/
│   ├── ARCHITECTURE.md              # Deep architecture walkthrough
│   └── ADR/0001-*.md                # Architecture decision records
├── e2e/layout.spec.ts               # Playwright smoke test
├── public/
│   ├── audio/*.mp3                  # Lift / burst / crackle SFX (preloaded)
│   ├── fonts/                       # Gabriola + 华文琥珀 font files
│   └── images/favicon.png
├── .github/
│   ├── workflows/ci.yml             # format + lint + typecheck + tests + e2e + build
│   ├── workflows/deploy.yml         # Builds out/ → GitHub Pages on push to main
│   ├── ISSUE_TEMPLATE/              # Bug report / feature request forms
│   ├── CODEOWNERS
│   ├── dependabot.yml               # Weekly npm dependency updates
│   └── pull_request_template.md
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
└── next.config.ts                   # Static export + basePath=/Firework_Simulator
```

For a detailed explanation of the architecture (why the shell factories work the way they do, where the particle pools come from, how the schema migration pipeline is structured), see [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) and the two ADRs in [`docs/ADR/`](./docs/ADR/).

---

## 🧩 Menu Options Reference

The in-game menu is in Chinese. Here's a quick English reference:

| 中文 Label | English       | Notes                                                                                                                       |
| ---------- | ------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 烟花类型   | Shell Type    | Random · Chrysanthemum · Ghost · Strobe · Palm · Ring · Crossette · Floral · Falling Leaves · Willow · Crackle · Horse Tail |
| 烟花大小   | Shell Size    | 3" · 4" · 6" · 8" · 12" · 16"                                                                                               |
| 画质       | Quality       | Low · Normal · High — trade particle count for frame rate on slow devices                                                   |
| 照亮天空   | Sky Lighting  | None · Dim · Normal — how much each burst tints the background                                                              |
| 缩放       | Scale Factor  | 50% · 62% · 75% · 90% · 100% · 150% · 200% — logical canvas resolution                                                      |
| 文字烟花   | Word Burst    | When on, every 5th shell explodes into Chinese text particles                                                               |
| 自动发射   | Auto Launch   | When on, shells launch automatically (no clicking required)                                                                 |
| 连发模式   | Finale Mode   | When on, launches a non-stop 32-shell barrage for big celebrations                                                          |
| 隐藏控件   | Hide Controls | Hides the top bar — press **M** at any time to bring the menu back                                                          |
| 全屏       | Fullscreen    | Toggles browser fullscreen mode                                                                                             |
| 长曝光     | Long Exposure | Trails fade out much slower — perfect for wallpaper screenshots                                                             |
| 自定义背景 | Background    | Image URL · `url(https://…)` · `linear-gradient(…)` etc.                                                                    |

---

## 🌐 Browser Support

| Browser                                   | Minimum version | Notes                                                           |
| ----------------------------------------- | --------------- | --------------------------------------------------------------- |
| **Chrome / Edge (Chromium)**              | 90+             | **Recommended.** Full feature support.                          |
| **Firefox**                               | 88+             | Full feature support.                                           |
| **Safari (desktop)**                      | 14+             | Audio unlocks on first user interaction (tap / click).          |
| **Safari (iOS)**                          | 14+             | Same as desktop. Fullscreen button may be hidden by the OS.     |
| **Android WebView / WeChat / QQ Browser** | latest          | Generally works. Fullscreen API may be blocked by the host app. |

> ⚠️ **HTTPS required.** Web Audio, the Fullscreen API, and cross-origin background images all require the page to be served over HTTPS. The GitHub Pages demo is always HTTPS; if you self-host, put this behind TLS or many features will silently degrade.

---

## ⚙️ Configuration

### Default values — tweak these for your fork

All frozen defaults live in `src/config/appConfig.ts`:

```ts
defaultWords: ["新年快乐", "平安喜乐", "万事顺意"]
defaultBackground: { mode: "none", value: "" } // or mode: "image" + a URL
wordFontFamily: "Gabriola,华文琥珀"
wordFontSizeMin: 60, wordFontSizeMax: 130
wordPointDensity: 3
wordBurstInterval: 5   // Every Nth shell becomes a word-burst
qualityLevels: { low: 1, normal: 2, high: 3 }
skyLightingModes: { none: 0, dim: 1, normal: 2 }
scaleFactorOptions: [0.5, 0.62, 0.75, 0.9, 1.0, 1.5, 2.0]
storageKey: "cm_fireworks_data"
storageVersion: "1.0"
```

### Runtime overrides — persisted to `localStorage`

- Quality auto-detect at boot (High on `navigator.hardwareConcurrency ≥ 8`; Normal otherwise):
  `src/stores/fireworksStore.ts` → `buildDefaultConfig`
- Shell size default: Desktop → 8", Mobile → 6", Header embed → 4"
- Background resolution fallback chain: **User value (persisted) → code default → none**
  See `src/lib/backgroundManager.ts` and `src/fireworks/background.ts`.

---

## 📦 Deployment

The project uses `output: "export"` in `next.config.ts`, so `pnpm build` emits pure static files to `out/`. Deploy them anywhere that serves static assets.

### GitHub Pages (recommended)

`.github/workflows/deploy.yml` already handles everything automatically on every push to `main` (or manual dispatch via the Actions tab).

You **must** do this **once** in repo settings, otherwise the deploy job fails with a permissions error:

> **Settings → Pages → Source → select "GitHub Actions"** (not "Deploy from a branch").

The `basePath` and `assetPrefix` are currently `/Firework_Simulator`, matching the existing repo name and Pages URL. If you rename the GitHub repo or fork it to a different name, **update both** in `next.config.ts` to match your new path, otherwise static assets 404.

### Other hosts

- **Vercel / Netlify / Cloudflare Pages** — Point them at the repo, set build command to `pnpm build`, publish directory to `out`. (On Vercel you can alternatively drop static export entirely and use their Next.js hosting — it works, just isn't static anymore.)
- **Nginx / S3 / any static server** — Upload the contents of `out/` verbatim. Ensure the server sets `Content-Type: text/html` for `.html` and serves `404.html` as the not-found page.

---

## ❓ FAQ

<details>
<summary>Q: Why is there no sound when I open the page?</summary>
<br>

Web browsers block Web Audio until the user has interacted with the page at least once (tap, click, or key press). Simply **click anywhere on the canvas or press Space** and audio will unlock for the rest of the session. This is an intentional browser restriction and there is no way around it — it prevents autoplay ads.
</details>

<details>
<summary>Q: The animation stutters / drops frames. How do I fix this?</summary>
<br>

Try these steps in order:

1. Open the Settings menu → change **Quality** from High → Normal → Low. This has the largest impact (cuts particle counts by ~4× between levels).
2. Reduce **Shell Size** to 8" or smaller — larger shells spawn exponentially more stars.
3. Turn off **Finale Mode** — 32 simultaneous shells is intentionally CPU-intensive.
4. Turn off **Long Exposure Mode**; it forces the canvas to accumulate pixels forever, which eventually saturates the GPU fill-rate on large displays.
5. Reduce **Scale Factor** to 75% or 50% — halves the logical canvas size for less fill work.

If you still see stuttering after all of the above, open DevTools → Performance and record a trace. Open an issue with a screenshot of the hot functions and we'll take a look.
</details>

<details>
<summary>Q: I pasted a custom background URL and nothing happened!</summary>
<br>

Check the following:

1. The URL must be a **direct link to the image file** (ends in `.png` / `.jpg` / `.webp` / `.gif`), not an HTML gallery page (e.g. Google Images / Pinterest / imgur albums).
2. The host server must send a proper `Access-Control-Allow-Origin` CORS header. Many image hosts explicitly block cross-site hotlinking — try Imgur or a domain you control.
3. As an alternative, paste any valid CSS `<image>` syntax directly:
   ```css
   linear-gradient(180deg, #0f0c29, #302b63, #24243e)
   radial-gradient(circle at 50% 0%, #2b1055, #7597de)
   url("https://example.com/your-image.jpg")
   ```

</details>

<details>
<summary>Q: Can I change the text that Word Burst uses?</summary>
<br>

Yes. Edit `defaultWords` in `src/config/appConfig.ts` and rebuild. The array is `readonly`, so keep it as a `as const` tuple. UI input for arbitrary custom text is on the roadmap (see below) but not implemented yet.
</details>

<details>
<summary>Q: I deployed to my own GitHub Pages and everything 404s.</summary>
<br>

Two common causes:

1. **You haven't switched the Pages source to "GitHub Actions" yet.** See [Deployment](#-deployment) above — this is the #1 reason.
2. **Your fork's repo name isn't `Firework_Simulator`.** If your repo URL is `https://github.com/<YOU>/my-pyro`, then open `next.config.ts` and change both `basePath` and `assetPrefix` from `"/Firework_Simulator"` to `"/my-pyro"`. Push again and the deploy job will emit assets under the correct sub-path.

</details>

<details>
<summary>Q: Where is this project from?</summary>
<br>

This is a TypeScript + Next.js rewrite of the original [Firework Simulator v2](https://codepen.io/MillerTime/pen/XgpNwb) by MillerTime on CodePen, with additional features inspired by [haodong108/fireworks-2023 (Gitee)](https://gitee.com/haodong108/fireworks-2023). Physics constants were preserved 1:1 for feel parity with the original. See the Credits section at the bottom for full attribution.
</details>

---

## 🛣️ Roadmap

Ideas and planned improvements, roughly ordered by likelihood:

- [ ] **Custom-word input** — UI text field so users can enter their own word-burst text without editing source
- [ ] **Shell editor** — combine glitter, crackle, crossette, ring, strobe, dual-color, etc. to make fully custom shell types
- [ ] **Shareable configs** — serialise the current settings (shell type + size + quality + backgrounds) into a URL hash or JSON export / import so people can share their favourite looks
- [ ] **Full runtime i18n** — not just the two READMEs, but actually localise all 12 in-game menu labels + help modals to English / Japanese / Korean and more
- [ ] **PWA / offline** — add `next-pwa` (or the new built-in Next.js PWA plugin) so the demo is installable and loads without internet
- [ ] **Performance profiler overlay** — optional on-canvas FPS counter, particle-count counter, and a frame-time heat bar to help tune quality on individual devices
- [ ] **Auto-firework choreographies** — pre-made scripted shows (e.g. a 1-minute New Year sequence) that run on page load

Vote for your favourites in the [Discussions](https://github.com/NianBroken/Firework_Simulator/discussions) — or implement one and open a PR (see [CONTRIBUTING.md](./CONTRIBUTING.md)).

---

## 🤝 Contributing

Contributions, issues and feature requests are all welcome! 🎇

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening your first PR — it covers the local setup, the `pnpm format:check + lint + typecheck + test --run + build` pre-push gate, shell-factory conventions, and the strict no-`as any` / no-empty-catch rules.

For security issues, see [SECURITY.md](./SECURITY.md) — **do not open a public issue**, use GitHub's private vulnerability disclosure instead.

---

## 📜 License

`Copyright © 2022 NianBroken. All rights reserved.`

Licensed under the [Apache License 2.0](./LICENSE). You are free to use, modify, and distribute this code, provided that you retain the original license and copyright notice in derivative works and publish any modifications under the same license. See the LICENSE file for the full text.

---

## 💝 Credits & Acknowledgements

This project would not exist without:

- 🔥 **MillerTime** — the original [Firework Simulator v2](https://codepen.io/MillerTime/pen/XgpNwb) on CodePen, whose physics constants and shell designs were preserved 1:1 for authentic feel
- 🧨 **haodong108** — [haodong108/fireworks-2023](https://gitee.com/haodong108/fireworks-2023) on Gitee, for the word-burst and custom-background feature inspirations
- 🎨 Everyone who has reported bugs, sent ideas, or simply shared screenshots of their favourite finales

---

<div align="center">

Made with ❤️ by NianBroken · [GitHub](https://github.com/NianBroken)

**[⬆️ Back to top](#-pyro)**

</div>
