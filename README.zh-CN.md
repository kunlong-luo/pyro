<div align="center">

<img src="./public/images/favicon.png" alt="Pyro 图标" width="120" />

# 🎆 Pyro · 烟花模拟器

**基于 Web 的真实 2D 粒子物理烟花模拟器。**

12 种弹壳类型 · Web Audio 立体音效 · 自定义背景 · 文字点阵烟花 · 自动连发序列 —— 纯静态，零后端。

<p>
  <a href="https://kunlong-luo.github.io/pyro/">
    <img src="https://img.shields.io/badge/🚀_在线演示-GitHub_Pages-2ea44f?style=for-the-badge" alt="Live Demo">
  </a>
  <a href="./LICENSE">
    <img src="https://img.shields.io/badge/许可证-Apache--2.0-blue?style=for-the-badge" alt="License">
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
  <img src="https://img.shields.io/github/actions/workflow/status/kunlong-luo/pyro/ci.yml?branch=main&label=CI" alt="CI Status">
  <img src="https://img.shields.io/github/actions/workflow/status/kunlong-luo/pyro/deploy.yml?branch=main&label=Deploy" alt="Deploy Status">
  <img src="https://img.shields.io/badge/测试-370_项通过-green" alt="Tests: 370 passed">
  <img src="https://img.shields.io/badge/覆盖率-~95%25-green" alt="Coverage: ~95%">
</p>

<p>
  <a href="./README.md">🇺🇸 English</a>
  ·
  <a href="https://github.com/kunlong-luo/pyro/discussions">💬 讨论区</a>
  ·
  <a href="./CONTRIBUTING.md">🤝 贡献指南</a>
</p>

</div>

---

## 👀 效果预览

> 👇 **直接点击上方「在线演示」去玩！** 静态图片完全展示不出效果 —— 进去随便点一下画面就能放炮，打开菜单勾选 **「连发模式」** 可以立刻看 32 发 Finale 压轴。

<img src="./public/images/preview.png" alt="Pyro 效果预览" width="800" />

---

## 🎮 操作说明

| 操作                                   | 效果                                            |
| -------------------------------------- | ----------------------------------------------- |
| 🖱️ **左键单击 / 触屏点击画面任意位置** | 在点击位置发射一发当前配置的烟花                |
| ⌨️ **空格键**                          | 暂停 / 继续模拟                                 |
| ⌨️ **M 键**                            | 打开 / 关闭设置菜单                             |
| ⏸️ **左上角按钮**                      | 暂停按钮                                        |
| 🔊 **顶部中央按钮**                    | 声音开关                                        |
| ⚙️ **右上角按钮**                      | 打开完整设置菜单                                |
| 🎚️ **画面底部边缘 — 按住水平拖拽**     | 调节模拟播放速度 0.25× ~ 1×（会显示蓝色速度条） |
| ☑️ 菜单中勾选 **「全屏」**             | 进入浏览器全屏模式                              |

> 💡 **小技巧：**
>
> - 开启 **「文字烟花」**：每 5 发就会随机炸出「新年快乐 / 平安喜乐 / 万事顺意」
> - 开启 **「连发模式」 Finale**：触发不间断 32 发高速压轴，最适合聚会场合
> - **「长曝光模式」**：烟花拖尾不会消退，非常适合截图做壁纸

---

## ✨ 功能特色

- **12 种弹壳类型** —— 菊花、幽灵、频闪、棕榈、圆环、十字、花朵、落叶、垂柳、噼啪、马尾、随机；另附 6 种自动发射序列（含 32 发压轴 Finale）
- **双 Canvas 渲染架构**：`mix-blend-mode: lighten` 混色 + 真实长曝光拖尾 + **动态夜空光照**（每次爆炸都会照亮背景）
- **Web Audio 引擎**：mp3 预加载缓冲，随机音高与音量，20 ms 微爆限流，独立的发射 / 爆炸 / 噼啪三个通道
- **文字（点阵）烟花**：把汉字字形栅格化转成粒子点阵实时发射，字体 & 密度可配置
- **自定义背景**：直接粘贴图片 URL、`url(...)` 或任意 CSS 图像语法（`linear-gradient(...)` / `radial-gradient(...)` / `image-set(...)`）
- **画质自适应**：基于 `navigator.hardwareConcurrency` 自动判定高/中/低配，并允许手动覆盖
- **移动端友好响应式**：宽度低至 375 px 均可流畅运行，触屏优先输入，Canvas 自动适配设备像素比
- **设置持久化 + 多版本迁移**：Zustand persist 中间件，支持旧版 1.x 和 2.x localStorage 配置自动规范化迁移
- **零后端纯静态**：导出产物可直接部署到 GitHub Pages / Vercel / Nginx 任意静态托管

---

## 🧰 技术栈

| 层级         | 说明                                                                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| **框架**     | Next.js 16（App Router、Turbopack、静态导出 `output: "export"`）                                                                     |
| **UI 层**    | React 19 + TypeScript 6（`strict`、`verbatimModuleSyntax`、`noUnusedLocals` 全开）+ Tailwind CSS 4                                   |
| **状态管理** | Zustand 5 + persist 中间件，自定义 `PersistStorage` 适配器 + 多版本迁移管道                                                          |
| **渲染层**   | Canvas 2D × 2 层（拖尾层 + 主层），单一 `requestAnimationFrame` Ticker 驱动，DPR 自适应 Stage 包装                                   |
| **音频层**   | Web Audio API，AudioBuffer 批量预加载，每声独立随机 gain 与 playbackRate                                                             |
| **测试体系** | Vitest 4（`jsdom` 环境 + `@testing-library/react` + `@testing-library/user-event`）+ Playwright E2E 烟雾测试 + size-limit 包体积预算 |
| **工程化**   | ESLint 9（`eslint-config-next` + `typescript-eslint` flat config，`--max-warnings=0`）+ Prettier（含 Tailwind 插件）                 |

---

## 🚀 快速开始

要求 **Node ≥ 20** 且 **pnpm ≥ 9**。

```bash
# 安装依赖
pnpm install

# 本地开发（默认 localhost:3000）
pnpm dev

# 静态导出构建 -> out/（可部署到任意静态托管）
pnpm build

# 本地预览生产构建
pnpm start

# -------- 代码质量 --------
pnpm lint              # ESLint 检查，0 警告才通过
pnpm typecheck         # tsc --noEmit 类型检查
pnpm format            # Prettier 自动格式化
pnpm format:check      # Prettier 检查（CI 使用）

# -------- 测试 -------------
pnpm test              # Vitest（watch 模式，写代码时跑）
pnpm test --run        # Vitest（单次运行，CI 使用）
pnpm test:coverage     # Vitest + v8 覆盖率报告
pnpm e2e               # Playwright E2E（需要先跑 pnpm dev 启 3000 端口）
pnpm size              # size-limit：打包产物 < 400 kB gzipped 才通过
```

---

## 📁 项目结构

```
pyro/
├── src/
│   ├── app/                         # Next.js App Router 入口
│   │   ├── layout.tsx               # CSP meta 标签、字体、HTML 外壳
│   │   ├── page.tsx                 # 根组件：组装 store + canvas + UI
│   │   ├── useFireworksSimulator.ts # 主 React Hook，装配整个引擎
│   │   ├── globals.css              # Tailwind 指令 + 原 CSS 移植
│   │   └── error.tsx / global-error.tsx
│   ├── components/                  # React UI 层（纯展示，无业务逻辑）
│   │   ├── Canvas/DualCanvas.tsx    # 两层 <canvas> + Ticker + 指针事件接线
│   │   ├── Controls.tsx             # 顶栏（暂停 / 声音 / 菜单 / 全屏）
│   │   ├── Menu.tsx                 # 设置菜单（所有表单选项 + 帮助弹窗触发）
│   │   ├── HelpModal.tsx            # 功能说明浮层
│   │   ├── LoadingInit.tsx          # 首次加载 Spinner
│   │   └── SvgSprite.tsx            # 内联 SVG 图标符号库
│   ├── fireworks/                   # 核心物理 & 渲染领域（完全不依赖 React）
│   │   ├── simulation.ts            # Shell 类、burst、主循环、粒子池
│   │   ├── shells/                  # 12 种弹壳工厂 + 连发序列 + 选择器（已模块化）
│   │   ├── particles/pools.ts       # Star / Spark / BurstFlash 对象池
│   │   ├── particles/effects.ts     # Crossette / Floral / Crackle / FallingLeaves 效果
│   │   ├── render/render.ts         # 所有粒子类型的 Canvas 绘制
│   │   ├── audio.ts                 # Web Audio 管理器（预加载 + 播放）
│   │   ├── interaction.ts           # 指针/键盘输入、速度条、自动发射调度
│   │   ├── skyLighting.ts           # 爆炸时的动态背景光照
│   │   ├── wordBurst.ts             # 每 N 发触发一次文字烟花的计数器
│   │   ├── device.ts                # IS_DESKTOP / IS_HEADER / 默认缩放
│   │   ├── constants.ts             # GRAVITY、COLOR、COLOR_CODES、PI_2…
│   │   └── selectors.ts             # 纯函数：state → 派生值
│   ├── stores/                      # Zustand
│   │   ├── fireworksStore.ts        # createFireworksStore + normalize + 多版本迁移
│   │   └── storeContext.tsx         # 提供给子组件的 React context
│   ├── lib/                         # 底层基础能力
│   │   ├── stage.ts                 # Stage（canvas + DPR）+ createTicker RAF 循环
│   │   ├── math.ts                  # MyMath 命名空间：距离/角度/夹取/文字点阵化
│   │   ├── fscreen.ts               # 带厂商前缀的 Fullscreen API 封装
│   │   └── backgroundManager.ts     # 背景应用/预加载/竞态取消
│   ├── config/
│   │   ├── appConfig.ts             # 冻结默认值（文字、背景、UI 文案）
│   │   ├── physics.ts               # 全部可调物理常量（BURST / LAUNCH / …）
│   │   └── csp.ts                   # Content-Security-Policy 头字符串
│   └── types/app.ts                 # 共享 TS 类型：QualityLevel / HelpContent / Selectors …
├── docs/
│   ├── ARCHITECTURE.md              # 深入架构说明
│   └── ADR/0001-*.md                # 架构决策记录
├── e2e/layout.spec.ts               # Playwright 烟雾测试
├── public/
│   ├── audio/*.mp3                  # 发射 / 爆炸 / 噼啪 音效（预加载）
│   ├── fonts/                       # Gabriola + 华文琥珀 字体
│   └── images/favicon.png
├── .github/
│   ├── workflows/ci.yml             # 格式化 + lint + 类型 + 单测 + e2e + 构建
│   ├── workflows/deploy.yml         # push main 时自动 out/ → GitHub Pages
│   ├── ISSUE_TEMPLATE/              # Bug / 功能请求表单
│   ├── CODEOWNERS
│   ├── dependabot.yml               # 每周 npm 依赖自动 PR
│   └── pull_request_template.md
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
└── next.config.ts                   # 静态导出 + basePath=/pyro
```

想了解架构细节（弹壳工厂为何这样设计、粒子池的零 GC 思路、迁移管道的版本语义），请阅读 [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) 和 [`docs/ADR/`](./docs/ADR/) 下的两份决策记录。

---

## 📦 部署

本项目在 `next.config.ts` 里使用 `output: "export"`，所以 `pnpm build` 会把纯静态产物全部输出到 `out/` 目录。上传到任何静态托管即可。

### GitHub Pages（推荐，免费 ✅）

`.github/workflows/deploy.yml` 已经写好全自动化流水线：每次 push 到 `main` 分支（或手动在 Actions 页点 Run workflow），就会自动构建 `out/` 并发布到 GitHub Pages。

你**必须**在仓库设置里手动做 **一次** 配置，否则 deploy job 会报权限错误失败：

> **Settings → Pages → Source → 选「GitHub Actions」**（不是「Deploy from a branch」）。

当前 `basePath` 和 `assetPrefix` 是 `/pyro`，匹配现有仓库名与 Pages URL。如果你重命名了仓库，或者 fork 到了别的仓库名下，**记得同步修改 `next.config.ts` 里的这两项** 为 `/你的新仓库名/`，否则所有静态资源都会 404。

### 其他托管方式

- **Vercel / Netlify / Cloudflare Pages** —— 指向仓库，构建命令填 `pnpm build`，发布目录填 `out/` 即可。（在 Vercel 上你也可以不用静态导出，直接用它们的 Next.js 官方托管 —— 一样能跑，只是不再是纯静态。）
- **Nginx / S3 / 任意静态服务器** —— 原样上传 `out/` 下全部文件，确保 `.html` 文件的 `Content-Type` 是 `text/html`，并把 404 页面指到 `404.html`。

---

## ❓ 常见问题 FAQ

<details>
<summary>Q：打开页面为什么没有声音？</summary>
<br>

浏览器安全策略规定 Web Audio 必须等用户**至少交互过一次**（点击 / 按键 / 触屏）后才能启动。解决方法：**在画面上点一下，或按一下空格**，声音就会在整个会话期间保持解锁。这是浏览器故意做的，用来阻止自动播放的广告声音，没有办法绕开。
</details>

<details>
<summary>Q：画面卡顿 / 掉帧怎么办？</summary>
<br>

按顺序尝试：

1. 打开设置菜单 → 把 **「画质」** 从高 → 正常 → 低。这一条影响最大（每档之间粒子数量差 4 倍）。
2. 把 **「烟花大小」** 降到 8" 或更小。越大的弹壳星星数量以平方级增长。
3. 关掉 **「连发模式 Finale」**：32 发并发本来就是 CPU 重度场景。
4. 关掉 **「长曝光模式」**：它会让 canvas 永远累积像素，大显示器下迟早把 GPU fill-rate 跑满。
5. 把 **「缩放」** 降到 75% 或 50%：直接减半逻辑画布大小，填充工作减半。

如果以上全做了仍然掉帧，打开 DevTools → Performance 录制一段，截一张热函数火焰图发 issue，我们来一起看。
</details>

<details>
<summary>Q：自定义背景 URL 粘贴了没反应？</summary>
<br>

排查以下几点：

1. URL 必须是**图片直链**（后缀 `.png` / `.jpg` / `.webp` / `.gif`），不能是百度图片 / Pinterest / 微博图床那种 HTML 相册页。
2. 目标图片服务器必须返回 `Access-Control-Allow-Origin` 跨域头。很多图床专门禁外链 —— 换 Imgur 或你自己可控的域名试试。
3. 也可以直接填合法的 CSS 图像语法：
   ```css
   linear-gradient(180deg, #0f0c29, #302b63, #24243e)
   radial-gradient(circle at 50% 0%, #2b1055, #7597de)
   url("https://example.com/your-image.jpg")
   ```

</details>

<details>
<summary>Q：文字烟花显示的文字能不能改？</summary>
<br>

可以。直接编辑 `src/config/appConfig.ts` 里的 `defaultWords` 数组再重新构建即可。注意那是 `readonly` 的 `as const` 元组，保留类型写法不要改。用户可输入自定义文字的 UI 功能在路线图上（见下文），但目前还没做。
</details>

<details>
<summary>Q：我部署到了自己的 GitHub Pages，结果所有资源全是 404？</summary>
<br>

两个最常见原因：

1. **还没把 Pages 源切到「GitHub Actions」。** 见上文 [部署](#-部署) 那一节，这是 90% 的情况。
2. **你 fork 的仓库名不是 `pyro`。** 如果仓库地址是 `https://github.com/<你的ID>/my-pyro`，打开 `next.config.ts`，把 `basePath` 和 `assetPrefix` 都从 `"/pyro"` 改成 `"/my-pyro"`，再 push 一次重跑 deploy job 即可。

</details>

<details>
<summary>Q：这个项目源自哪里？</summary>
<br>

本项目是 CodePen 上 MillerTime 原作 [Firework Simulator v2](https://codepen.io/MillerTime/pen/XgpNwb) 的 TypeScript + Next.js 重写版，文字烟花和自定义背景等额外特性参考了 Gitee 上 [haodong108/fireworks-2023](https://gitee.com/haodong108/fireworks-2023) 的实现思路。物理常量保留了 1:1 以保证手感与原作一致。完整致谢见底部 Credits。
</details>

---

## 🤝 参与贡献

欢迎提 Bug、提功能想法、发 PR！🎇

开你第一个 PR 之前请先读 [`CONTRIBUTING.md`](./CONTRIBUTING.md) —— 里面写了本地环境怎么搭、提 PR 前必须跑过的 `pnpm format:check + lint + typecheck + test --run + build` 五件套、弹壳工厂的代码约定，以及严格禁止 `as any` 和空 `catch` 等规则。

如果你发现了**安全问题**，请阅读 [`SECURITY.md`](./SECURITY.md) —— **绝对不要开公开 issue**，走 GitHub 的私有漏洞披露通道。

---

## 📜 开源协议

`Copyright © 2022-2026 kunlong-luo. All rights reserved.`

以 [Apache License 2.0](./LICENSE) 协议发布。你可以自由使用、修改、分发本项目的代码，但前提是在衍生作品中保留原始协议文本与版权声明，并且对所有修改过的代码也要以同样的协议发布。完整条款见 LICENSE 文件。

---

<div align="center">

Made with ❤️ by kunlong-luo · [GitHub 主页](https://github.com/kunlong-luo)

**[⬆️ 回到顶部](#-pyro--烟花模拟器)**

</div>
