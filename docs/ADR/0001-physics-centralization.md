# ADR-0001: 物理常量集中管理

**状态**：已采纳  
**日期**：2026-08-28  
**决策者**：重构 P0/P1 阶段

## 背景

在重构前，物理/模拟相关的魔法数字散落在多个文件中：

- `simulation.ts`：空气阻力系数、发射速度公式、爆炸参数、粒子默认值
- `particles/pools.ts`：粒子池相关常量
- `skyLighting.ts`：天空光照参数
- `render.ts`：渲染参数（线宽、拖尾透明度、渐变色阶）
- `interaction.ts`：交互阈值（按钮大小、速度条参数）

这种散落导致：

1. **难以调参**：修改一个物理效果需要在多个文件中查找相关数字
2. **容易遗漏**：同一概念的数字分散在不同位置，修改时容易漏改
3. **缺乏语义**：裸数字没有命名，无法理解其物理含义

## 决策

将所有物理/模拟常量集中到 `src/config/physics.ts`，按领域分组：

| 分组                  | 常量                                     | 来源             |
| --------------------- | ---------------------------------------- | ---------------- |
| `AIR_DRAG`            | 空气阻力系数（star/starHeavy/spark）     | `simulation.ts`  |
| `LAUNCH`              | 发射几何参数（边距、最小高度、速度因子） | `simulation.ts`  |
| `BURST`               | 爆炸参数（扩散速度、密度、最小星数）     | `simulation.ts`  |
| `COMET`               | 彗星拖尾参数（火花频率、生命值）         | `simulation.ts`  |
| `GLITTER`             | 闪光配置（6 种强度级别）                 | `simulation.ts`  |
| `PARTICLE`            | 粒子默认值（火花频率、速度、生命值）     | `simulation.ts`  |
| `TRANSITION`          | 颜色过渡与频闪参数                       | `simulation.ts`  |
| `PISTIL` / `STREAMER` | 子壳参数                                 | `simulation.ts`  |
| `SKY_LIGHTING`        | 天空光照参数                             | `skyLighting.ts` |
| `RENDER`              | 渲染参数（线宽、拖尾、渐变）             | `render.ts`      |
| `INTERACTION`         | 交互阈值                                 | `interaction.ts` |
| `SOUND`               | 音效缩放参数                             | `simulation.ts`  |

所有值从原始代码 1:1 移植，`Object.freeze()` 冻结防止篡改。

## 方案对比

### 方案 A：集中到 physics.ts（已采纳）

**优点**：

- 单一事实来源，所有物理常量在一个文件中
- 按领域分组，语义清晰（`BURST.spreadSizeDivider` 比裸数字 `96` 更易理解）
- 消费者可从一个导入获取所需常量
- `Object.freeze()` 防止运行时意外修改

**缺点**：

- `physics.ts` 成为较大文件（273 行），但仍在合理范围内
- 需要一次性迁移，但迁移后无维护成本

### 方案 B：保留在原位，添加注释

**优点**：零迁移成本

**缺点**：

- 仍然散落，调参仍需跨文件搜索
- 注释可能与代码不同步
- 不解决根本问题

### 方案 C：拆分为多个物理模块（如 drag.ts、burst.ts）

**优点**：更细粒度的组织

**缺点**：

- 过度拆分，273 行的单文件完全可管理
- 增加导入复杂度
- 对于常量集合，分组比拆分更自然

## 影响

- **正面**：`simulation.ts`、`render.ts`、`skyLighting.ts`、`interaction.ts` 中的裸数字减少，替换为语义化常量导入
- **正面**：调参只需修改 `physics.ts` 一个文件
- **中性**：`src/fireworks/constants.ts` 保持不变，`GRAVITY`/`MAX_WIDTH`/`MAX_HEIGHT` 通过 re-export 从 `physics.ts` 可达
- **无负面影响**：纯常量提取，不改变运行时行为

## 相关文件

- `src/config/physics.ts` — 新增
- `src/fireworks/simulation.ts` — 消费方
- `src/fireworks/render/render.ts` — 消费方
- `src/fireworks/skyLighting.ts` — 消费方
- `src/fireworks/interaction.ts` — 消费方
- `src/fireworks/constants.ts` — re-export 来源
