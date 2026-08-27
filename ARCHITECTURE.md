# 烟花模拟器 (Firework Simulator) - 架构与代码总结

> **项目名称**：烟花模拟器 (Firework Simulator / 烟花模拟器)
> **作者**：NianBroken
> **开源协议**：Apache-2.0
> **开发语言**：原生 JavaScript (ES6+)
> **运行环境**：浏览器 (Canvas 2D API)
> **构建系统**：无（浏览器直接加载运行）

---

## 1. 项目概述

基于 Web 的烟花模拟系统，具备逼真的粒子物理效果、多种弹壳类型、音频同步、自定义背景及完整的设置 UI。作为单页面应用（SPA）开发，**零外部依赖**。

**核心特性：**

- **12+ 种烟花弹壳类型**：每种均包含独特的视觉行为与爆炸效果
- **实时粒子模拟**：星粒（Stars）、火花（Sparks）、爆炸闪光（Burst Flashes）
- **Web Audio API**：高度同步的音效系统
- **自定义背景**：支持图片、渐变及自定义 CSS 样式
- **文字烟花**：基于文本点阵生成的字样烟花
- **自动发射序列**：可配置的自动发射模式与节奏
- **全屏与质量自适应**：自动检测设备性能并调整渲染质量
- **本地状态持久化**：基于 `localStorage` 保存配置
- **响应式设计**：完美适配移动端与桌面端

---

## 2. 文件目录结构

```text
Firework_Simulator/
├── index.html                  # 入口文件、DOM 结构、脚本加载顺序
├── css/
│   └── style.css               # 样式文件 (444 行)
├── js/
│   ├── app/                    # 应用层 (UI、状态管理、配置)
│   │   ├── config.js           # 常量配置与默认值
│   │   ├── store.js            # 状态管理 (类似 Redux 架构)
│   │   ├── ui.js               # DOM 查询、界面渲染与事件绑定
│   │   └── background-manager.js # 背景图片/渐变管理器
│   ├── fireworks/              # 烟花物理引擎核心
│   │   ├── runtime.js          # 全局运行时、常量定义、状态选择器
│   │   ├── shells.js           # 烟花弹壳定义与发射序列
│   │   ├── simulation.js       # 物理更新 loop 与 Canvas 渲染逻辑
│   │   ├── interaction.js      # 用户交互 handling (指针、键盘、窗口缩放)
│   │   ├── audio.js            # Web Audio API 音效管理器
│   │   └── engine.js           # 初始化与事件挂载入口
│   └── lib/                    # 基础工具库
│       ├── MyMath.js           # 数学工具函数与文字点阵生成器
│       ├── Stage.js            # Canvas 封装器 + 帧率循环器 (Ticker)
│       └── fscreen.js          # 全屏 API 跨浏览器兼容 Polyfill
├── audio/                      # 音效资源 (MP3)
│   ├── lift1-3.mp3             # 升空音效
│   ├── burst1-2.mp3            # 爆炸音效
│   ├── burst-sm-1-2.mp3        # 微型爆炸音效
│   ├── crackle1.mp3            # 噼啪声
│   └── crackle-sm-1.mp3        # 微型噼啪声
├── fonts/                      # 字体文件 (WOFF2, TTF)
├── images/
│   └── favicon.png
├── LICENSE
├── README.md
└── Image_Preview.png

```

---

## 3. 模块架构

### 3.1 依赖关系图

```text
index.html
    │
    ├── js/lib/fscreen.js          ──► (无依赖)
    ├── js/lib/Stage.js            ──► fscreen (通过 window 隐式依赖)
    ├── js/lib/MyMath.js           ──► (无依赖)
    │
    ├── js/app/config.js           ──► (无依赖) → 暴露 window.FireworksAppConfig
    ├── js/app/store.js            ──► config.js → 暴露 window.FireworksAppStore
    ├── js/app/background-manager.js ──► config.js → 暴露 window.FireworksBackgroundManager
    ├── js/app/ui.js               ──► config.js → 暴露 window.FireworksAppUI
    │
    ├── js/fireworks/runtime.js    ──► config, store, background-manager, ui
    ├── js/fireworks/shells.js     ──► runtime (全局变量), MyMath
    ├── js/fireworks/simulation.js ──► runtime, shells, MyMath
    ├── js/fireworks/interaction.js ──► runtime, shells
    ├── js/fireworks/audio.js      ──► runtime, MyMath
    └── js/fireworks/engine.js     ──► runtime, ui, audio, simulation (系统初始化)

```

**加载顺序**（基于 `index.html`）：

1. `fscreen.js` → `Stage.js` → `MyMath.js` (核心底层库)
2. `config.js` → `store.js` → `background-manager.js` → `ui.js` (应用逻辑层)
3. `runtime.js` → `shells.js` → `interaction.js` → `simulation.js` → `audio.js` → `engine.js` (烟花模拟引擎)

---

### 3.2 模块职责表

| 模块                      | 核心职责                                                            | 主要暴露对象/导出                                                |
| ------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **config.js**             | 包含不可变的配置常量、默认选项、帮助文档文本与 DOM 选择器           | `FireworksAppConfig`                                             |
| **store.js**              | 单一状态树管理，支持状态变更订阅、数据标准化与版本迁移              | `createDefaultState`, `createStore`, `normalizeConfig`           |
| **ui.js**                 | DOM 节点查询、控制组件生成、界面渲染与 UI 事件绑定                  | `queryNodes`, `populateControls`, `renderApp`, `bindAppControls` |
| **background-manager.js** | 背景图片/渐变色的加载、校验与 CSS 转换应用                          | `createBackgroundManager`                                        |
| **runtime.js**            | 全局常量定义、设备性能检测、状态 Selector 与背景解耦处理            | 全局常量、`store`、`backgroundManager`、状态选择函数             |
| **shells.js**             | 各种烟花弹壳构造逻辑、随机弹壳生成器与自动发射序列算法              | `shellTypes`, `shellNames`, `randomShell`, `startSequence`       |
| **simulation.js**         | 核心物理引擎更新循环与 Canvas 渲染（星粒、火花、拖尾、夜空光照）    | `update`, `render`, `colorSky`, 粒子工厂函数                     |
| **interaction.js**        | 触控/鼠标/键盘交互处理、自动发射定时器、模拟速度调节                | `handlePointerStart/End/Move`, `handleKeydown`, `updateGlobals`  |
| **audio.js**              | 基于 Web Audio API 的音频上下文管理、音频解码与随机音调播放         | `soundManager` (preload, playSound, pauseAll 等)                 |
| **engine.js**             | 整体应用启动、资源加载流程调度与运行阶段绑定                        | `init`, `attachRuntimeBindings`                                  |
| **MyMath.js**             | 数学辅助函数、随机数生成算法、文本转粒子点阵矩阵算法                | `MyMath` (`dist`, `angle`, `splitVector`, `literalLattice` 等)   |
| **Stage.js**              | Canvas 像素比（DPR）适配、尺寸缩放、统一事件绑定与帧迭代器 (Ticker) | `Stage`, `Ticker`                                                |
| **fscreen.js**            | 跨浏览器的全屏 API 标准化封装                                       | `fscreen`                                                        |

---

## 4. 核心子系统分析

### 4.1 状态管理系统 (store.js)

**设计模式**：轻量级类 Redux 单一状态树：

- 状态不可变更新：通过 `setState(partial)` 提交变更
- 发布/订阅机制：支持 `subscribe(listener)` 触发视图同步
- 数据持久化：自动同步至 `localStorage`，支持 Schema 版本迁移（如 1.0 → 2.1）

**状态结构简图**：

```javascript
{
  paused: false,          // 是否暂停
  soundEnabled: true,     // 音效开关
  menuOpen: false,        // 菜单状态
  openHelpTopic: null,    // 当前展开的帮助项
  fullscreen: false,      // 全屏状态
  config: {
    quality: "2",         // 画质级别: 1(低), 2(中), 3(高)
    shell: "Random",      // 当前选择的弹壳类型
    size: "3",            // 爆炸规模
    wordShell: false,     // 是否开启文字烟花
    autoLaunch: true,     // 自动发射
    finale: false,        // 终局/高潮狂欢模式
    skyLighting: "2",     // 夜空环境光照强度
    hideControls: false,  // 隐藏控制栏
    longExposure: false,  // 长曝光模式
    scaleFactor: 1.0      // 缩放比例
  },
  background: { mode: "none", value: "", configured: false }
}

```

---

### 4.2 粒子物理模拟引擎 (simulation.js)

**双层粒子分类架构**：

1. **Star（主星粒）**：爆炸产生的主要粒子，粒子轨迹绘制在 `trails-canvas` 上。
2. **Spark（次级火花）**：主星粒在运动过程中剥落/喷射出的微小火花。
3. **BurstFlash（爆炸闪光）**：中心瞬间生成的径向渐变光辉。
4. **Main Canvas（主画布）**：仅绘制当前帧星粒的“头部”高亮点，用于制造微光感。

**单帧物理计算流程**：

- 阻力计算：应用空气阻力（`airDrag` / `airDragHeavy`）衰减速度
- 重力加速度：全局叠加 `GRAVITY = 0.9`
- 旋转与彗星运动：针对特定 Shell 算法计算自旋轨迹
- 火花喷发：根据速率和寿命，在星粒当前坐标下生成 Spark 实例
- 渐变与闪烁：处理 `secondColor` 颜色过渡以及 Strobe（频闪）效果

**渲染管线**：

```text
update(frameTime, lag) ──► updateGlobals() ──► 物理状态更新 ──► render()
render() ──► colorSky() ──► 清除/淡化旧轨迹 ──► 绘制爆炸闪光 ──► 绘制星粒拖尾 ──► 在 Main Canvas 绘制星粒头部 ──► 绘制 Spark 拖尾

```

---

### 4.3 烟花弹壳与发射系统 (shells.js)

**12 种核心弹壳类型**：

| 弹壳名称 (Shell Type)     | 视觉特征与行为                                                 |
| ------------------------- | -------------------------------------------------------------- |
| **Chrysanthemum (菊花)**  | 经典球形密集爆炸，带有渐变花芯（Pistil）、亮粉与拖尾 streamers |
| **Ghost (幽灵)**          | 隐形星粒飞行一段时间后突然显色，寿命长且带有柔和拖尾           |
| **Strobe (频闪)**         | 剧烈闪烁的高亮星粒，可搭配对比色花芯                           |
| **Palm (棕榈)**           | 数量少但极其粗壮的星粒，带有极其漫长的金粉拖尾                 |
| **Ring (圆环)**           | 扁平或倾斜的环状粒子分布，中间伴随微型花芯                     |
| **Crossette (交叉/花冠)** | 星粒到达寿命终点时，二次分裂为 4 个呈十字飞开的子星粒          |
| **Floral (花朵)**         | 星粒消逝时二次爆发成微型花簇                                   |
| **Falling Leaves (落叶)** | 隐形粒子在空中缓缓落下，同时不断剥落金色闪烁的“落叶”           |
| **Willow (垂柳)**         | 极其持久的金色亮粉拖尾，受重力影响如下垂的柳枝                 |
| **Crackle (噼啪声)**      | 星粒死亡时爆发出密集伴随爆裂声的金色微粒                       |
| **Horse Tail (马尾)**     | 紧凑向上抛出的星粒，顶端受重力翻转下坠                         |
| **Random (随机)**         | 按权重算法自动随机选择一种弹壳构建                             |

**自动发射算法序列 (Launch Sequences)**：

- `seqRandomShell`：随机发射单个烟花
- `seqTwoRandom`：左右两侧同时发射
- `seqTriple`：中间先发，两侧延迟跟随
- `seqPyramid`：从两侧向中间递进的金字塔 barrage 序列
- `seqSmallBarrage`：基于余弦波节奏的快速连续扫射发射

---

### 4.4 音效系统 (audio.js)

基于 **Web Audio API** 实现的高性能音频处理：

- **延迟初始化**：受浏览器 Autoplay 策略限制，在首次用户交互后激活 AudioContext
- **预加载与解码**：启动阶段异步拉取 MP3 资源并完成 `decodeAudioData`
- **随机防重**：同一类音效（如升空声、爆炸声）提供多个文件变体，播放时动态随机挑选并微调音高（Playback Rate）和音量，避免听觉疲劳
- **音频限流**：微型爆裂声（burstSmall）内置 20ms 防重叠冷却时间

---

### 4.5 文字烟花技术 (MyMath.literalLattice + simulation.js)

1. **文字转点阵**：创建离屏 Canvas 绘制指定文本，利用 `getImageData()` 提取像素 alpha 值。
2. **坐标采样**：根据设定的点阵密度（`wordPointDensity`）将文字像素转化为相对二维坐标阵列。
3. **点阵缓存**：使用 `wordDotCache` Map 进行缓存，避免重复计算相同文本。
4. **渲染映射**：文字烟花爆炸时，星粒运动的目标点被强制约束在文字点阵坐标上，实现字样烟花效果。

---

### 4.6 背景管理器 (background-manager.js)

支持三种模式：

1. **none**：无背景（纯黑夜空）
2. **image**：通过 URL 异步加载图片并应用为 CSS `background-image`
3. **style**：直接注入自定义 CSS 表达式（如 `linear-gradient(...)`）

处理机制包含：异步 fetch 校验、请求防抖取消（Cancel stale request）、错误退回机制（用户设置失败时退回默认背景）。

---

## 5. 画布与渲染架构

### 5.1 双 Canvas 渲染模型

```html
<canvas id="trails-canvas"></canvas>
<!-- 绘制持久化残影与拖尾 (lighten 混合模式) -->
<canvas id="main-canvas"></canvas>
<!-- 绘制当前帧真实位置 (source-over 混合模式) -->
```

- **拖尾画布 (`trails-canvas`)**：每次更新时不会完全清空，而是覆盖一层带有微小 Alpha 值的黑幕（如 `rgba(0,0,0,0.175)`），使历史帧的粒子逐渐消退，形成拖尾。
- **长曝光模式 (`longExposure`)**：将拖尾画布的清空 Alpha 降低至 `0.0025`，使烟花轨迹长期保留在屏幕上。
- **夜空光照 (`colorSky`)**：实时计算屏幕所有活跃星粒的 RGB 均值，按比例动态改变背景容器的 `backgroundColor`，模拟烟花照亮夜空的效果。

---

## 6. 性能优化手段

1. **对象池 (Object Pooling)**：`Star._pool`、`Spark._pool` 和 `BurstFlash._pool` 实现了高频粒子的复用，极大地减少了 GC（垃圾回收）开销。
2. **画质分级 (Quality Scaling)**：根据设备性能动态降低 Spark 生成频率与粒子总数限制。
3. **帧率平滑与截断 (Time Clamping)**：将单帧 Δt 强制约束在 `[17ms, 68ms]` 范围内，防止由于切后台导致的“死亡膨胀/突变”。
4. **O(1) 颜色索引**：通过 `Star.active[colorCode]` 数组归类活跃星粒，提升按颜色批量渲染的性能。
5. **DPR 控制**：提供高 DPI 禁用选项，允许低端设备强制降分辨率渲染。

---

## 7. 部署与扩展指南

### 部署说明

本系统为纯静态项目：

- **无需编译构建**：直接将代码上传至 GitHub Pages、Vercel 或 Nginx 静态目录即可运行。
- **协议要求**：由于使用了 Web Audio 及全屏 API，建议部署在 HTTPS 环境下。

### 常用扩展点

- **新增烟花弹壳**：在 `js/fireworks/shells.js` 的 `shellTypes` 中添加新的工厂函数，并在 `shellNames` 登记。
- **新增音效资源**：在 `js/fireworks/audio.js` 的 `soundManager.sources` 中注册音频文件路径。
- **自定义默认文字**：修改 `js/app/config.js` 中的 `defaultWords` 数组。
