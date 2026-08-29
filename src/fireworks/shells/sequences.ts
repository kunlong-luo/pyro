import { shellNameSelector, shellSizeSelector } from "@/fireworks/selectors";
import type { WordBurstTracker } from "@/fireworks/wordBurst";
import type { ShellRuntime } from "./runtime";
import type { ShellCtor, ShellFactory } from "./factories";
import { crysanthemumShell, ringShell, namedShellTypes } from "./factories";
import type { ShellContext } from "./selection";
import {
  randomFastShell,
  randomShell,
  shellFromConfig,
  getRandomShellSize,
  getRandomShellPositionH,
  getRandomShellPositionV,
  configuredShellName,
} from "./selection";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Full context needed by sequence and launch functions. */
export interface SequenceContext extends ShellContext {
  shellCtor: ShellCtor;
  stageWidth: number;
  stageHeight: number;
  registerUserInteraction: () => void;
  wordBurstTracker: WordBurstTracker;
  runtime: ShellRuntime;
}

/** Click/touch event payload for launchShellFromConfig. */
export interface LaunchEvent {
  x: number;
  y: number;
}

// ---------------------------------------------------------------------------
// Launch helper
// ---------------------------------------------------------------------------

export function launchShellFromConfig(event: LaunchEvent | null, ctx: SequenceContext): void {
  ctx.registerUserInteraction();
  const shell = new ctx.shellCtor(
    shellFromConfig(shellSizeSelector(ctx.state), ctx.quality, ctx, ctx.runtime),
  );

  if (event && ctx.state.config.wordShell) {
    shell.forceWordBurst = true;
    ctx.wordBurstTracker.reset();
  }

  shell.launch(
    event ? event.x / ctx.stageWidth : getRandomShellPositionH(),
    event ? 1 - event.y / ctx.stageHeight : getRandomShellPositionV(),
  );
}

// ---------------------------------------------------------------------------
// Sequences
// ---------------------------------------------------------------------------

export function seqRandomShell(ctx: SequenceContext): number {
  const size = getRandomShellSize(ctx.state);
  const shell = new ctx.shellCtor(shellFromConfig(size.size, ctx.quality, ctx, ctx.runtime));
  shell.launch(size.x, size.height);

  let extraDelay = shell.starLife;
  if (shell.fallingLeaves) {
    extraDelay = 4600;
  }

  return 900 + Math.random() * 600 + extraDelay;
}

export function seqRandomFastShell(ctx: SequenceContext): number {
  const shellFactory = randomFastShell(ctx);
  const size = getRandomShellSize(ctx.state);
  const shell = new ctx.shellCtor(shellFactory(size.size, ctx.quality, ctx.runtime));
  shell.launch(size.x, size.height);

  return 900 + Math.random() * 600 + shell.starLife;
}

export function seqTwoRandom(ctx: SequenceContext): number {
  const firstSize = getRandomShellSize(ctx.state);
  const secondSize = getRandomShellSize(ctx.state);
  const firstShell = new ctx.shellCtor(
    shellFromConfig(firstSize.size, ctx.quality, ctx, ctx.runtime),
  );
  const secondShell = new ctx.shellCtor(
    shellFromConfig(secondSize.size, ctx.quality, ctx, ctx.runtime),
  );
  const leftOffset = Math.random() * 0.2 - 0.1;
  const rightOffset = Math.random() * 0.2 - 0.1;

  firstShell.launch(0.3 + leftOffset, firstSize.height);
  setTimeout(() => {
    secondShell.launch(0.7 + rightOffset, secondSize.height);
  }, 100);

  let extraDelay = Math.max(firstShell.starLife, secondShell.starLife);
  if (firstShell.fallingLeaves || secondShell.fallingLeaves) {
    extraDelay = 4600;
  }

  return 900 + Math.random() * 600 + extraDelay;
}

export function seqTriple(ctx: SequenceContext): number {
  const shellFactory = randomFastShell(ctx);
  const baseSize = shellSizeSelector(ctx.state);
  const smallSize = Math.max(0, baseSize - 1.25);
  const baseOffset = Math.random() * 0.08 - 0.04;

  new ctx.shellCtor(shellFactory(baseSize, ctx.quality, ctx.runtime)).launch(0.5 + baseOffset, 0.7);

  const leftDelay = 1000 + Math.random() * 400;
  const rightDelay = 1000 + Math.random() * 400;

  setTimeout(() => {
    const offset = Math.random() * 0.08 - 0.04;
    new ctx.shellCtor(shellFactory(smallSize, ctx.quality, ctx.runtime)).launch(0.2 + offset, 0.1);
  }, leftDelay);

  setTimeout(() => {
    const offset = Math.random() * 0.08 - 0.04;
    new ctx.shellCtor(shellFactory(smallSize, ctx.quality, ctx.runtime)).launch(0.8 + offset, 0.1);
  }, rightDelay);

  return 4000;
}

export function seqPyramid(ctx: SequenceContext): number {
  const barrageCountHalf = ctx.isDesktop ? 7 : 4;
  const largeSize = shellSizeSelector(ctx.state);
  const smallSize = Math.max(0, largeSize - 3);
  const mainShellFactory: ShellFactory = Math.random() < 0.78 ? crysanthemumShell : ringShell;
  const specialShellFactory: ShellFactory = (size, quality, rt) =>
    randomShell(size, quality, ctx, rt);

  function launchSequenceShell(x: number, useSpecial: boolean): void {
    const isRandomShell = shellNameSelector(ctx.state) === "Random";
    const shellFactory: ShellFactory = isRandomShell
      ? useSpecial
        ? specialShellFactory
        : mainShellFactory
      : (namedShellTypes[configuredShellName(ctx.state)] ?? mainShellFactory);
    const shell = new ctx.shellCtor(
      shellFactory(useSpecial ? largeSize : smallSize, ctx.quality, ctx.runtime),
    );
    const height = x <= 0.5 ? x / 0.5 : (1 - x) / 0.5;
    shell.launch(x, useSpecial ? 0.75 : height * 0.42);
  }

  let count = 0;
  let delay = 0;
  while (count <= barrageCountHalf) {
    if (count === barrageCountHalf) {
      setTimeout(() => {
        launchSequenceShell(0.5, true);
      }, delay);
    } else {
      const offset = (count / barrageCountHalf) * 0.5;
      const delayOffset = Math.random() * 30 + 30;
      setTimeout(() => {
        launchSequenceShell(offset, false);
      }, delay);
      setTimeout(() => {
        launchSequenceShell(1 - offset, false);
      }, delay + delayOffset);
    }

    count += 1;
    delay += 200;
  }

  return 3400 + barrageCountHalf * 250;
}

export function seqSmallBarrage(ctx: SequenceContext): number {
  ctx.runtime.seqSmallBarrageLastCalled = Date.now();
  const barrageCount = ctx.isDesktop ? 11 : 5;
  const specialIndex = ctx.isDesktop ? 3 : 1;
  const shellSize = Math.max(0, shellSizeSelector(ctx.state) - 2);
  const mainShellFactory: ShellFactory = Math.random() < 0.78 ? crysanthemumShell : ringShell;
  const specialShellFactory = randomFastShell(ctx);

  function launchSequenceShell(x: number, useSpecial: boolean): void {
    const isRandomShell = shellNameSelector(ctx.state) === "Random";
    const factory: ShellFactory = isRandomShell
      ? useSpecial
        ? specialShellFactory
        : mainShellFactory
      : (namedShellTypes[configuredShellName(ctx.state)] ?? mainShellFactory);
    const shell = new ctx.shellCtor(factory(shellSize, ctx.quality, ctx.runtime));
    const height = (Math.cos(x * 5 * Math.PI + Math.PI * 0.5) + 1) / 2;
    shell.launch(x, height * 0.75);
  }

  let count = 0;
  let delay = 0;
  while (count < barrageCount) {
    if (count === 0) {
      launchSequenceShell(0.5, false);
      count += 1;
    } else {
      const offset = (count + 1) / barrageCount / 2;
      const delayOffset = Math.random() * 30 + 30;
      const useSpecial = count === specialIndex;
      setTimeout(() => {
        launchSequenceShell(0.5 + offset, useSpecial);
      }, delay);
      setTimeout(() => {
        launchSequenceShell(0.5 - offset, useSpecial);
      }, delay + delayOffset);
      count += 2;
    }

    delay += 200;
  }

  return 3400 + barrageCount * 120;
}
