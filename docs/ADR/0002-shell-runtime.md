# ADR-0002: ShellRuntime 替代模块级 let 状态

**状态**：已采纳  
**日期**：2026-08-28  
**决策者**：重构 P0/P1 阶段

## 背景

重构前，`src/fireworks/shells.ts` 中有 4 个模块级 `let` 变量管理烟花会话的可变状态：

```typescript
let lastColor: string | undefined;
let isFirstSeq = true;
let currentFinaleCount = 0;
let seqSmallBarrageLastCalled = Date.now();
```

这些变量的问题：

1. **并发隔离**：如果存在多个模拟实例（测试、多 Canvas），它们共享同一组 `let` 变量，状态互相污染
2. **测试困难**：每个测试用例需要手动重置这些变量，容易遗漏导致测试间状态泄漏
3. **不可控生命周期**：模块级变量的生命周期与模块本身绑定，无法按需创建/销毁

## 决策

引入 `ShellRuntime` 接口和 `createShellRuntime()` 工厂函数：

```typescript
export interface ShellRuntime {
  lastColor: string | undefined;
  isFirstSeq: boolean;
  currentFinaleCount: number;
  seqSmallBarrageLastCalled: number;
}

export function createShellRuntime(): ShellRuntime {
  return {
    lastColor: undefined,
    isFirstSeq: true,
    currentFinaleCount: 0,
    seqSmallBarrageLastCalled: Date.now(),
  };
}
```

所有消费这些状态的函数（`randomColor`、`startSequence`、`seqSmallBarrage` 等）改为接收 `ShellRuntime` 参数，而非访问模块级变量。

## 方案对比

### 方案 A：ShellRuntime 接口 + 工厂函数（已采纳）

**优点**：

- 每个模拟实例拥有独立的运行时状态
- 测试中可通过 `createShellRuntime()` 创建干净的实例，无需手动重置
- 生命周期由调用方控制（在 `useFireworksSimulator` 中通过 `useMemo` 创建）
- 类型安全：`ShellRuntime` 接口明确声明了所需的状态字段

**缺点**：

- 需要修改所有消费这些状态的函数签名（一次性迁移成本）
- 每个函数多一个参数

### 方案 B：模块级 let + resetRuntime() 函数

**优点**：迁移成本低，只需添加重置函数

**缺点**：

- 仍然无法支持多实例并发
- 测试仍需手动调用 reset，容易遗漏
- 全局状态的本质问题未解决

### 方案 C：将状态移入 Zustand Store

**优点**：统一状态管理

**缺点**：

- 这些是模拟器内部的临时会话状态，不属于应用级状态
- 放入 Store 会增加不必要的序列化/订阅开销
- 混淆了"持久化配置"和"会话运行时"的职责边界

### 方案 D：将状态移入 Simulation 闭包

**优点**：与 `createSimulation` 的闭包模式一致

**缺点**：

- `ShellRuntime` 的状态在 `shells.ts` 中产生（`randomColor`、`startSequence`），在 `simulation.ts` 中不直接使用
- 违反了"状态应在产生它的模块中管理"的原则

## 影响

- **正面**：解决了并发隔离和测试隔离问题
- **正面**：`useFireworksSimulator` 通过 `useMemo(() => createShellRuntime(), [])` 创建实例，生命周期与组件一致
- **中性**：`shells.ts` 中的 12 个工厂函数和 6 个序列函数签名增加 `runtime: ShellRuntime` 参数
- **无负面影响**：纯结构重构，不改变运行时行为

## 消费方

- `src/app/useFireworksSimulator.ts` — 创建 `ShellRuntime` 实例，传递给 `launchShellFromConfig` 和 `startSequence`
- `src/fireworks/shells.ts` — 所有工厂函数和序列函数接收 `ShellRuntime`
- `src/fireworks/simulation.ts` — 不直接使用（`ShellRuntime` 是 `shells.ts` 的职责）

## 相关文件

- `src/fireworks/shells.ts` — `ShellRuntime` 定义和 `createShellRuntime()`
- `src/app/useFireworksSimulator.ts` — 实例创建和传递
- `src/fireworks/shells.test.ts` — 测试中使用独立的 `ShellRuntime` 实例
