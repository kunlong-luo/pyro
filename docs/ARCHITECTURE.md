# Pyro 架构文档

> 本文档描述 Pyro 烟花模拟器的整体架构、核心数据流、模块职责与部署方式。

## 概述

Pyro 是一个纯前端的烟花模拟器，具备真实 2D 粒子物理、12 种弹壳类型、Web Audio 音效和自定义背景。项目基于 Next.js 16（App Router + 静态导出）构建，零后端依赖，部署为纯静态站点。

核心技术特征：

- **闭包工厂模式**：所有核心模块（`createSimulation`、`createInteraction`、`createSoundManager`）通过 `createXxx(deps)` 工厂函数创建，依赖显式注入，无模块级全局可变状态
- **对象池复用**：`Star`、`Spark`、`BurstFlash` 使用对象池（`_pool` + `active` 数组），避免频繁 GC
- **依赖注入**：所有模块通过 `Deps` 接口接收依赖，支持独立测试和多实例并发

## 技术栈

| 层级 | 技术                    | 说明                                                   |
| ---- | ----------------------- | ------------------------------------------------------ |
| 框架 | Next.js 16              | App Router、Turbopack、`output: "export"` 静态导出     |
| UI   | React 19 + TypeScript 6 | strict 模式，`verbatimModuleSyntax`                    |
| 样式 | Tailwind CSS 4          | 配合 `prettier-plugin-tailwindcss`                     |
| 状态 | Zustand 5               | 持久化 + schema 版本迁移                               |
| 渲染 | Canvas 2D               | 双层 Canvas（`mix-blend-mode: lighten`）实现长曝光拖尾 |
| 音频 | Web Audio API           | 随机音高/音量 + 20ms 微爆限流                          |
| 测试 | Vitest 4 + Playwright   | 单元测试 + E2E 测试                                    |

## 核心数据流

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐     ┌───────────┐
│  Zustand    │────▶│  simulation.ts   │────▶│  shells.ts  │────▶│ render.ts │
│  Store      │     │  (物理引擎)       │     │  (弹壳工厂)  │     │ (Canvas)  │
└─────────────┘     └──────────────────┘     └─────────────┘     └───────────┘
       │                    │                       │
       │                    ▼                       │
       │           ┌──────────────────┐            │
       │           │ particles/pools  │            │
       │           │ (Star/Spark/     │            │
       │           │  BurstFlash)     │            │
       │           └──────────────────┘            │
       │                                           │
       ▼                                           ▼
┌──────────────────────────────────────────────────────────────┐
│                  useFireworksSimulator.ts                    │
│           (React Hook — 顶层编排，连接所有模块)                │
└──────────────────────────────────────────────────────────────┘
```

**数据流说明**：

1. **Store → Simulation**：`createSimulation` 通过 `getState()` 闭包读取 Zustand 状态（画质、弹壳大小、运行状态等）
2. **Simulation → Shells**：`Shell` 类在 `simulation.ts` 内部定义，通过 `simulation.Shell` 暴露给外部；弹壳工厂（`shells.ts`）生成 `ShellOptions` 配置
3. **Shells → Render**：`createSimulation` 的 `update()` 方法每帧调用 `render()` 函数，将粒子池中的 `Star`/`Spark`/`BurstFlash` 绘制到双层 Canvas
4. **Hook 编排**：`useFireworksSimulator`（`src/app/useFireworksSimulator.ts`）作为顶层 React Hook，负责创建所有模块实例、连接依赖、管理生命周期

## 目录结构

```
src/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # 主页面，组合所有组件
│   ├── useFireworksSimulator.ts  # 顶层 Hook，编排所有模块
│   ├── layout.tsx                # 根布局（CSP meta 标签）
│   ├── error.tsx / global-error.tsx  # Error Boundary
│   └── globals.css               # 全局样式
├── config/
│   ├── appConfig.ts              # 冻结的应用配置（文字、背景、画质等级）
│   ├── physics.ts                # 物理常量集中管理（单一事实来源）
│   └── csp.ts                    # Content Security Policy 配置
├── stores/
│   ├── fireworksStore.ts         # Zustand Store + 持久化 + schema 迁移
│   └── storeContext.tsx          # React Context Provider
├── fireworks/                    # 核心物理引擎
│   ├── simulation.ts             # 物理引擎工厂（Shell 类、粒子池、update 循环）
│   ├── shells.ts                 # 12 种弹壳工厂 + ShellRuntime + 发射序列
│   ├── particles/
│   │   ├── pools.ts              # Star/Spark/BurstFlash 对象池
│   │   └── effects.ts            # 爆炸特效（crossette/floral/crackle/fallingLeaves）
│   ├── render/
│   │   └── render.ts             # Canvas 渲染逻辑
│   ├── audio.ts                  # Web Audio 音效管理
│   ├── interaction.ts            # 指针/键盘/速度条交互
│   ├── skyLighting.ts            # 天空动态光照
│   ├── background.ts             # 背景回退链
│   ├── constants.ts              # 颜色、物理基础常量
│   ├── device.ts                 # 设备检测（移动端/桌面端/HEADER）
│   ├── selectors.ts              # 状态选择器（纯函数）
│   └── wordBurst.ts              # 文字烟花触发器
├── lib/
│   ├── stage.ts                  # Stage + Ticker（DPR 管理、帧率控制）
│   ├── math.ts                   # MyMath 工具函数
│   ├── fscreen.ts                # 全屏 API polyfill
│   └── backgroundManager.ts      # 背景图片/样式加载管理
├── components/
│   ├── Canvas/
│   │   ├── DualCanvas.tsx        # 双层 Canvas 组件
│   │   └── index.ts
│   ├── Menu.tsx                  # 设置菜单
│   ├── Controls.tsx              # 控制按钮栏
│   ├── HelpModal.tsx             # 帮助弹窗
│   ├── LoadingInit.tsx           # 加载状态
│   └── SvgSprite.tsx             # SVG 图标
└── types/
    └── app.ts                    # 共享 TypeScript 类型定义
```

## 关键模块职责

### `src/config/physics.ts` — 物理常量中心

所有物理/模拟常量的单一事实来源，包括空气阻力、发射参数、爆炸参数、粒子默认值、颜色过渡、渲染参数等。从 `simulation.ts`、`pools.ts`、`skyLighting.ts`、`render.ts`、`interaction.ts` 中的散落魔法数字集中而来。

详见 [ADR-0001](./ADR/0001-physics-centralization.md)。

### `src/fireworks/shells.ts` — 弹壳工厂与运行时

- **`ShellRuntime`** 接口：封装单次烟花会话的可变状态（`lastColor`、`isFirstSeq`、`currentFinaleCount`、`seqSmallBarrageLastCalled`），通过 `createShellRuntime()` 创建独立实例
- **弹壳工厂**：12 种命名弹壳（`namedShellTypes`）+ Random 选择逻辑
- **发射序列**：`startSequence` 根据配置和随机概率选择不同的自动发射模式（单发、双发、三连、金字塔、密集齐射、finale）

详见 [ADR-0002](./ADR/0002-shell-runtime.md)。

### `src/fireworks/simulation.ts` — 物理引擎

闭包工厂 `createSimulation(deps)` 返回 `{ update, Shell }`：

- **`Shell` 类**：在工厂内部定义，可访问闭包状态（画质、速度等），负责发射轨迹计算和爆炸触发
- **`update(frameTime, lag)`**：每帧更新所有活跃粒子的位置、生命周期、颜色过渡、闪光效果，最后调用 `render()` 绘制
- **粒子池**：`Star`、`Spark`、`BurstFlash` 通过 `particles/pools.ts` 管理，使用 `returnInstance()` 回收

### `src/app/useFireworksSimulator.ts` — 顶层编排

React Hook，职责：

1. 创建 Zustand Store、`ShellRuntime`、`WordBurstTracker`（通过 `useMemo` 保证稳定性）
2. 在 `onTickerReady` 回调中创建 `Simulation`、`Interaction`、`SoundManager`、`BackgroundManager`
3. 连接所有模块的依赖关系（通过 ref 和闭包打破循环依赖）
4. 管理窗口事件（resize、fullscreen、keyboard）
5. 暴露 UI 回调给 `page.tsx`

### `src/stores/fireworksStore.ts` — 状态管理

- 使用 Zustand `persist` 中间件，自定义 `createAppStorage()` 适配器
- 支持 schema 版本迁移（`1.1` → `1.2` → `2.0` → `2.1` → `1.0`）
- 仅持久化 `config` 和 `background` 字段，运行时状态（`paused`、`soundEnabled` 等）不持久化

## 部署

### 静态导出

`next.config.ts` 配置 `output: "export"`，`pnpm build` 产物为 `out/` 目录，可部署至任意静态托管服务。

### GitHub Pages

`.github/workflows/deploy.yml` 在每次推送到 `main` 时自动构建并发布。需要一次性仓库设置：**Settings → Pages → Source → GitHub Actions**。

生产环境的 `basePath`/`assetPrefix` 为 `/Firework_Simulator`，与 GitHub 仓库实际名称保持一致。

### CSP（Content Security Policy）

静态导出无法设置 HTTP 响应头，因此通过 `src/app/layout.tsx` 中的 `<meta httpEquiv="Content-Security-Policy">` 标签注入 CSP 策略，配置定义在 `src/config/csp.ts`。

## 设计约束

- **无全局可变状态**：所有模块通过工厂函数创建实例，闭包封装可变状态
- **依赖注入**：核心模块不直接导入其他核心模块，通过 `Deps` 接口注入
- **冻结配置**：`fireworksAppConfig` 使用 `Object.freeze()` 防止运行时篡改
- **严格 TypeScript**：`strict: true`、`noUnusedLocals/Parameters`、`verbatimModuleSyntax`
- **中文 UI 文本**：测试直接断言中文标签
