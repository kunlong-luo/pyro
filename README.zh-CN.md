<div align="center">

# Pyro

**基于 Web 的烟花模拟器，具备真实粒子物理效果。**

真实 2D 粒子物理、12 种弹壳、Web Audio、自定义背景 —— 基于 Next.js + React + TypeScript 构建。

![License](https://img.shields.io/badge/license-Apache--2.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6)

<img src="./public/images/favicon.png" alt="Pyro icon" width="96" />

[English](./README.md)

</div>

<img src="./Image_Preview.png" alt="Pyro 预览" width="640" />

## 在线演示

**https://nianbroken.github.io/Firework_Simulator/**

> 演示地址仍沿用本项目原本的仓库名，原因见下方[部署](#部署)说明。

## 功能特性

- **12 种弹壳** —— 菊花、幽灵、频闪、棕榈、圆环、十字、花朵、落叶、垂柳、噼啪、马尾、随机，另有 6 种自动发射序列（含 32 连发 finale）
- **双 Canvas 渲染**（`mix-blend-mode: lighten`、长曝光拖尾）+ 动态夜空光照
- **Web Audio** 随机音高/音量 + 20ms 微爆限流
- **文字烟花**（点阵文字弹幕）+ 自定义背景（图片 / 渐变 / CSS）
- 全屏模式、画质自动检测（`navigator.hardwareConcurrency`）、响应式适配移动端
- 设置持久化（Zustand + 版本化迁移），纯静态、无后端

## 技术栈

|          |                                                       |
| -------- | ----------------------------------------------------- |
| 框架     | Next.js 16（App Router、Turbopack、静态导出）         |
| UI       | React 19 + TypeScript 6（strict）+ Tailwind CSS 4     |
| 状态管理 | Zustand 5（持久化 + schema 迁移）                     |
| 渲染     | Canvas 2D + Web Audio API                             |
| 工具链   | ESLint 9（`eslint-config-next`）+ Prettier + Vitest 4 |

## 快速开始

```bash
pnpm install
pnpm dev             # 本地开发 localhost:3000
pnpm build            # 静态导出 -> out/
pnpm start             # 预览生产构建

pnpm lint               # 代码检查
pnpm typecheck          # tsc --noEmit
pnpm format:check       # prettier --check
pnpm test               # 单元测试
pnpm test:coverage      # 单元测试 + 覆盖率
```

要求 Node ≥ 20，pnpm ≥ 9。

## 目录结构

```
src/
  app/                        # Next.js App Router 入口
    layout.tsx / page.tsx / globals.css
  config/appConfig.ts         # 冻结默认值（文字、背景、画质）
  types/app.ts                # QualityLevel、Selectors、HelpContent...
  stores/fireworksStore.ts    # Zustand 状态 + 归一化/迁移
  lib/
    math.ts                   # MyMath
    stage.ts                  # Stage + Ticker（DPR、截断 [17,68]、500ms 触摸去重）
    fscreen.ts                # 全屏 polyfill
    backgroundManager.ts      # fetch vs Image、requestId 防竞态
  fireworks/
    constants.ts               # GRAVITY、COLOR、PI_2...
    device.ts                  # IS_MOBILE/DESKTOP/HEADER
    selectors.ts                # 状态选择器
    wordBurst.ts                 # 每 5 发触发器
    shells.ts                    # 12 种弹壳工厂（+ quality 参数）
    simulation.ts                 # Shell/Star/Spark/BurstFlash 对象池 + 物理
    audio.ts                      # SoundManager 工厂
    interaction.ts                # 指针/键盘/缩放/速度条
    background.ts                 # 背景回退链
  components/
    Canvas/DualCanvas.tsx
    Controls.tsx / Menu.tsx / HelpModal.tsx / LoadingInit.tsx / SvgSprite.tsx
public/
  audio/  fonts/  images/  favicon.png
```

## 配置修改

默认值都在 `src/config/appConfig.ts`：

```ts
defaultWords: ["新年快乐", "平安喜乐", "万事顺意"]
defaultBackground: { mode: "none", value: "" } // image 填 URL，style 填 linear-gradient(...)
wordFontFamily: "Gabriola,华文琥珀"
qualityLevels: { low: 1, normal: 2, high: 3 }
scaleFactorOptions: [0.5, 0.62, 0.75, 0.9, 1.0, 1.5, 2.0]
```

运行时覆盖持久化于 `localStorage`：

- `src/stores/fireworksStore.ts`（`buildDefaultConfig`）—— 画质自适应，`isDesktop ? size 3 : 2`
- 背景解析：`src/lib/backgroundManager.ts` + `src/fireworks/background.ts`，回退链 `用户设置 → 代码默认 → 无`

## 部署

纯静态导出（`next.config.ts` 中 `output: "export"`）—— `pnpm build` 产物为 `out/`，可托管至任意静态服务（GitHub Pages / Vercel / Nginx）。Audio/全屏 API 建议在 HTTPS 下使用。

生产环境的 `basePath`/`assetPrefix` 目前仍是 `/Firework_Simulator`，与本仓库实际（未改名的）名称和 GitHub Pages 路径保持一致——这次改名只涉及项目的展示名称与 `package.json` 包名（改为 Pyro），并未重命名 GitHub 仓库本身。

## 许可证

`Copyright © 2022 NianBroken. All rights reserved.`

采用 [Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0) 许可证。

## 特别感谢

- [Firework Simulator v2](https://codepen.io/MillerTime/pen/XgpNwb) by MillerTime
- [haodong108/fireworks-2023](https://gitee.com/haodong108/fireworks-2023)

欢迎提交 Issues 与 Pull Requests。
