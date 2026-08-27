<div align="center">

# 烟花模拟器

基于 Web 的烟花模拟器，具备真实粒子物理、12 种弹壳、Web Audio 与自定义背景，现已用 React 19 + TypeScript + Tailwind CSS 重构。

<img src="./public/images/favicon.png" alt="preview" width="96" />

[English](./README.md)

</div>

## 预览

- 线上演示（原版）：https://nianbroken.github.io/Firework_Simulator/
- 本地开发：`pnpm dev` → http://localhost:5173

<img src="./Image_Preview.png" alt="preview" width="640" />

## 功能特性

- 12 种弹壳（菊花、幽灵、频闪、棕榈、圆环、十字、花朵、落叶、垂柳、噼啪、马尾、随机）+ 6 种自动发射序列（含 32 连发射 finale）
- 双 Canvas 渲染（`mix-blend: lighten`、长曝光）+ 夜空光照
- Web Audio 随机音高/音量 + 20ms 微爆限流
- 文字烟花（`literalLattice` 点阵）+ Zustand 持久化设置 + 自定义背景（图片/渐变/CSS）
- 全屏、画质自适应（`hardwareConcurrency`）、响应式（840/560）
- 纯静态，无后端

## 技术栈

- **React 19** + **TypeScript 6**（strict）+ **Vite 8** + **Tailwind CSS 4**
- **Zustand 5**（persist + 1.1/1.2/2.0/2.1 → 1.0 迁移）
- **ESLint 9** + **Prettier** + **Vitest 4**
- Canvas 2D + Web Audio API

## 快速开始

```bash
pnpm install
pnpm dev        # 本地开发
pnpm build      # 生产构建 -> dist/
pnpm preview    # 预览构建
pnpm lint       # 代码检查
npx tsc --noEmit # 类型检查
pnpm test       # 单测（待补充）
```

要求 Node ≥ 20，pnpm ≥ 9。

## 目录结构

```
src/
  App.tsx / main.tsx          # 启动、Store、Ticker 装配
  index.css                   # Tailwind + 原 444 行 style.css 翻译
  config/appConfig.ts         # 冻结默认值（文字、背景、画质）
  types/app.ts                # QualityLevel、Selectors、HelpContent...
  stores/fireworksStore.ts    # Zustand 状态 + 归一化/迁移
  lib/math.ts                 # MyMath
  lib/stage.ts                # Stage + Ticker（DPR、截断 [17,68]、500ms 触摸去重）
  lib/fscreen.ts              # 全屏 polyfill
  lib/backgroundManager.ts    # fetch vs Image、requestId 防竞态
  fireworks/constants.ts      # GRAVITY、COLOR、PI_2...
  fireworks/device.ts         # IS_MOBILE/DESKTOP/HEADER
  fireworks/selectors.ts      # 状态选择器
  fireworks/wordBurst.ts      # 每 5 发触发器
  fireworks/shells.ts         # 12 工厂（+ quality 参）
  fireworks/simulation.ts     # Shell/Star/Spark/BurstFlash 对象池 + 物理
  fireworks/audio.ts          # SoundManager 工厂
  fireworks/interaction.ts    # 指针/键盘/缩放/速度条
  fireworks/background.ts     # 回退链
  app/ui.ts                   # 原 ui.js 1:1 移植（queryNodes/renderApp）
  components/Canvas/DualCanvas.tsx
  components/Controls.tsx/Menu.tsx/HelpModal.tsx/LoadingInit.tsx/SvgSprite.tsx
public/
  audio/  fonts/  images/  favicon.png
```

旧 `js/` / `css/` 已移除，`public/` 为 Vite 静态根，`legacy.index.html` 为原入口现已改为 `index.html → src/main.tsx`。

## 配置修改

默认值在 `src/config/appConfig.ts`：

```ts
defaultWords: ["新年快乐", "平安喜乐", "万事顺意"]
defaultBackground: { mode: "none", value: "" } // image 填 URL，style 填 linear-gradient(...)
wordFontFamily: "Gabriola,华文琥珀"
qualityLevels: { low: 1, normal: 2, high: 3 }
scaleFactorOptions: [0.5, 0.62, 0.75, 0.9, 1.0, 1.5, 2.0]
```

运行时覆盖持久化于 `localStorage` 键 `cm_fireworks_data`：

- `src/stores/fireworksStore.ts:buildDefaultConfig` – 画质自适应、`isDesktop ? size 3 : 2`
- 背景：`src/lib/backgroundManager.ts` + `src/fireworks/background.ts` 回退链 `网页端 → 代码默认 → 无`

## 架构

详见 [ARCHITECTURE.md](./ARCHITECTURE.md)（中文，含模块图、物理、渲染管线、扩展点）。

## 部署

纯静态。`pnpm build` 产物 `dist/` 使用相对 `base: "./"`，可直接托管至 GitHub Pages / Vercel / Nginx，HTTPS 下 Audio/全屏更稳定。

## 许可证

`Copyright © 2022 NianBroken. All rights reserved.`

采用 [Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0) 许可证。

## 特别感谢

- [Firework Simulator v2](https://codepen.io/MillerTime/pen/XgpNwb) by MillerTime
- [haodong108/fireworks-2023](https://gitee.com/haodong108/fireworks-2023)

欢迎提交 Issues 与 Pull Requests。
