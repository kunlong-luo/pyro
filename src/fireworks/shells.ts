/**
 * Shell factories, selection helpers, and launch sequences
 * ported from js/fireworks/shells.js (1:1 port).
 *
 * All factories take an explicit {@link ShellRuntime} context for mutable
 * per-session state (lastColor, finale counters, cooldown timestamps).
 * Selection and launch helpers accept their dependencies via params
 * (state, device flags, stage dimensions, Shell constructor, etc.) so there
 * are no hidden globals.
 */

import {
  COLOR,
  COLOR_CODES,
  INVISIBLE,
  PI_2,
  QUALITY_LOW,
  QUALITY_HIGH,
} from "@/fireworks/constants";
import { shellNameSelector, shellSizeSelector, finaleSelector } from "@/fireworks/selectors";
import type { FireworksState } from "@/stores/fireworksStore";
import type { QualityLevel } from "@/types/app";
import type { WordBurstTracker } from "@/fireworks/wordBurst";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Explicit mutable state for a single fireworks session.
 * Create via {@link createShellRuntime} — never share across independent
 * simulations (tests, multiple canvases, etc.).
 */
export interface ShellRuntime {
  /** Last color returned by {@link randomColor} (used for notSame avoidance). */
  lastColor: string | undefined;
  /** Whether the next {@link startSequence} call is the very first one. */
  isFirstSeq: boolean;
  /** Number of rapid-fire finale shells launched so far in the current burst. */
  currentFinaleCount: number;
  /** Timestamp (ms) of the last {@link seqSmallBarrage} invocation. */
  seqSmallBarrageLastCalled: number;
}

/**
 * Create a fresh {@link ShellRuntime} for a new fireworks session.
 * Each runtime is fully independent — safe for concurrent use.
 */
export function createShellRuntime(): ShellRuntime {
  return {
    lastColor: undefined,
    isFirstSeq: true,
    currentFinaleCount: 0,
    seqSmallBarrageLastCalled: Date.now(),
  };
}

/** Configuration object returned by every shell factory. */
export interface ShellOptions {
  shellSize: number;
  spreadSize: number;
  starLife: number;
  starLifeVariation?: number;
  starDensity?: number;
  color: string | string[];
  secondColor?: string | null;
  glitter?: string;
  glitterColor?: string;
  pistil?: boolean;
  pistilColor?: string | false;
  streamers?: boolean;
  ring?: boolean;
  crossette?: boolean;
  floral?: boolean;
  fallingLeaves?: boolean;
  horsetail?: boolean;
  strobe?: boolean;
  strobeColor?: string | null;
  crackle?: boolean;
  starCount?: number;
}

/** Minimal shell instance interface used by sequences. */
export interface ShellInstance {
  starLife: number;
  fallingLeaves?: boolean;
  forceWordBurst?: boolean;
  launch(x: number, y: number): void;
}

/** Constructor type for Shell (matches simulation.js Shell class). */
export type ShellCtor = new (config: ShellOptions) => ShellInstance;

/** Pure shell factory: takes size, quality, and runtime context → config. */
export type ShellFactory = (
  size: number,
  quality: QualityLevel,
  runtime: ShellRuntime,
) => ShellOptions;

/** Options for the randomColor helper. */
interface RandomColorOptions {
  notSame?: boolean;
  notColor?: string;
  limitWhite?: boolean;
}

/** Position result from getRandomShellSize. */
export interface ShellPositionResult {
  size: number;
  x: number;
  height: number;
}

/** Device and quality context needed by selection helpers. */
export interface ShellContext {
  quality: QualityLevel;
  isHeader: boolean;
  isDesktop: boolean;
  state: FireworksState;
}

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
// Constants
// ---------------------------------------------------------------------------

export const finaleCount = 32;
export const fastShellBlacklist = ["Falling Leaves", "Floral", "Willow"];
export const seqSmallBarrageCooldown = 15000;

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

function randomColorSimple(): string {
  return COLOR_CODES[(Math.random() * COLOR_CODES.length) | 0];
}

export function randomColor(
  options: RandomColorOptions | undefined,
  runtime: ShellRuntime,
): string {
  const notSame = options?.notSame;
  const notColor = options?.notColor;
  const limitWhite = options?.limitWhite;
  let color = randomColorSimple();

  if (limitWhite && color === COLOR.White && Math.random() < 0.6) {
    color = randomColorSimple();
  }

  if (notSame) {
    while (color === runtime.lastColor) {
      color = randomColorSimple();
    }
  } else if (notColor) {
    while (color === notColor) {
      color = randomColorSimple();
    }
  }

  runtime.lastColor = color;
  return color;
}

export function randomWord(words: readonly string[]): string {
  if (words.length === 0) {
    return "";
  }

  if (words.length === 1) {
    return words[0];
  }

  return words[(Math.random() * words.length) | 0];
}

export function whiteOrGold(): string {
  return Math.random() < 0.5 ? COLOR.Gold : COLOR.White;
}

export function makePistilColor(shellColor: string, runtime: ShellRuntime): string {
  if (shellColor === COLOR.White || shellColor === COLOR.Gold) {
    return randomColor({ notColor: shellColor }, runtime);
  }

  return whiteOrGold();
}

// ---------------------------------------------------------------------------
// Shell factories (pure: size + quality + runtime → ShellOptions)
// ---------------------------------------------------------------------------

export const crysanthemumShell: ShellFactory = (size = 1, quality, runtime) => {
  const glitter = Math.random() < 0.25;
  const singleColor = Math.random() < 0.72;
  const color: string | string[] = singleColor
    ? randomColor({ limitWhite: true }, runtime)
    : [randomColor(undefined, runtime), randomColor({ notSame: true }, runtime)];
  const pistil = singleColor && Math.random() < 0.42;
  // pistil is only true when singleColor is true → color is a string
  const pistilColor: string | false = pistil ? makePistilColor(color as string, runtime) : false;
  const secondColor: string | null =
    singleColor && (Math.random() < 0.2 || (color as string) === COLOR.White)
      ? pistilColor || randomColor({ notColor: color as string, limitWhite: true }, runtime)
      : null;
  const streamers =
    !pistil && (typeof color !== "string" || color !== COLOR.White) && Math.random() < 0.42;
  let starDensity = glitter ? 1.1 : 1.25;

  if (quality === QUALITY_LOW) {
    starDensity *= 0.8;
  }
  if (quality === QUALITY_HIGH) {
    starDensity = 1.2;
  }

  return {
    shellSize: size,
    spreadSize: 300 + size * 100,
    starLife: 900 + size * 200,
    starDensity,
    color,
    secondColor,
    glitter: glitter ? "light" : "",
    glitterColor: whiteOrGold(),
    pistil,
    pistilColor,
    streamers,
  };
};

export const ghostShell: ShellFactory = (size = 1, quality, runtime) => {
  const shell = crysanthemumShell(size, quality, runtime);
  const ghostColor = randomColor({ notColor: COLOR.White }, runtime);
  const pistil = Math.random() < 0.42;
  const pistilColor = pistil && makePistilColor(ghostColor, runtime);

  shell.starLife *= 1.5;
  shell.streamers = true;
  shell.color = INVISIBLE;
  shell.secondColor = ghostColor;
  shell.glitter = "";
  shell.pistil = pistil;
  shell.pistilColor = pistilColor;

  return shell;
};

export const strobeShell: ShellFactory = (size = 1, _quality, runtime) => {
  const color = randomColor({ limitWhite: true }, runtime);
  return {
    shellSize: size,
    spreadSize: 280 + size * 92,
    starLife: 1100 + size * 200,
    starLifeVariation: 0.4,
    starDensity: 1.1,
    color,
    glitter: "light",
    glitterColor: COLOR.White,
    strobe: true,
    strobeColor: Math.random() < 0.5 ? COLOR.White : null,
    pistil: Math.random() < 0.5,
    pistilColor: makePistilColor(color, runtime),
  };
};

export const palmShell: ShellFactory = (size = 1, _quality, runtime) => {
  const color = randomColor(undefined, runtime);
  const thick = Math.random() < 0.5;
  return {
    shellSize: size,
    color,
    spreadSize: 250 + size * 75,
    starDensity: thick ? 0.15 : 0.4,
    starLife: 1800 + size * 200,
    glitter: thick ? "thick" : "heavy",
  };
};

export const ringShell: ShellFactory = (size = 1, _quality, runtime) => {
  const color = randomColor(undefined, runtime);
  const pistil = Math.random() < 0.75;
  return {
    shellSize: size,
    ring: true,
    color,
    spreadSize: 300 + size * 100,
    starLife: 900 + size * 200,
    starCount: 2.2 * PI_2 * (size + 1),
    pistil,
    pistilColor: makePistilColor(color, runtime),
    glitter: pistil ? "" : "light",
    glitterColor: color === COLOR.Gold ? COLOR.Gold : COLOR.White,
    streamers: Math.random() < 0.3,
  };
};

export const crossetteShell: ShellFactory = (size = 1, _quality, runtime) => {
  const color = randomColor({ limitWhite: true }, runtime);
  return {
    shellSize: size,
    spreadSize: 300 + size * 100,
    starLife: 750 + size * 160,
    starLifeVariation: 0.4,
    starDensity: 0.85,
    color,
    crossette: true,
    pistil: Math.random() < 0.5,
    pistilColor: makePistilColor(color, runtime),
  };
};

export const floralShell: ShellFactory = (size = 1, _quality, runtime) => ({
  shellSize: size,
  spreadSize: 300 + size * 120,
  starDensity: 0.12,
  starLife: 500 + size * 50,
  starLifeVariation: 0.5,
  color:
    Math.random() < 0.65
      ? "random"
      : Math.random() < 0.15
        ? randomColor(undefined, runtime)
        : [randomColor(undefined, runtime), randomColor({ notSame: true }, runtime)],
  floral: true,
});

export const fallingLeavesShell: ShellFactory = (size = 1) => ({
  shellSize: size,
  color: INVISIBLE,
  spreadSize: 300 + size * 120,
  starDensity: 0.12,
  starLife: 500 + size * 50,
  starLifeVariation: 0.5,
  glitter: "medium",
  glitterColor: COLOR.Gold,
  fallingLeaves: true,
});

export const willowShell: ShellFactory = (size = 1) => ({
  shellSize: size,
  spreadSize: 300 + size * 100,
  starDensity: 0.6,
  starLife: 3000 + size * 300,
  glitter: "willow",
  glitterColor: COLOR.Gold,
  color: INVISIBLE,
});

export const crackleShell: ShellFactory = (size = 1, quality, runtime) => {
  const color = Math.random() < 0.75 ? COLOR.Gold : randomColor(undefined, runtime);
  return {
    shellSize: size,
    spreadSize: 380 + size * 75,
    starDensity: quality === QUALITY_LOW ? 0.65 : 1,
    starLife: 600 + size * 100,
    starLifeVariation: 0.32,
    glitter: "light",
    glitterColor: COLOR.Gold,
    color,
    crackle: true,
    pistil: Math.random() < 0.65,
    pistilColor: makePistilColor(color, runtime),
  };
};

export const horsetailShell: ShellFactory = (size = 1, _quality, runtime) => {
  const color = randomColor(undefined, runtime);
  return {
    shellSize: size,
    horsetail: true,
    color,
    spreadSize: 250 + size * 38,
    starDensity: 0.9,
    starLife: 2500 + size * 300,
    glitter: "medium",
    glitterColor: Math.random() < 0.5 ? whiteOrGold() : color,
    strobe: color === COLOR.White,
  };
};

// ---------------------------------------------------------------------------
// Shell registry & names
// ---------------------------------------------------------------------------

/** Named shell factories keyed by display name (no "Random" entry). */
export const namedShellTypes: Record<string, ShellFactory> = {
  Crackle: crackleShell,
  Crossette: crossetteShell,
  Crysanthemum: crysanthemumShell,
  "Falling Leaves": fallingLeavesShell,
  Floral: floralShell,
  Ghost: ghostShell,
  "Horse Tail": horsetailShell,
  Palm: palmShell,
  Ring: ringShell,
  Strobe: strobeShell,
  Willow: willowShell,
};

/**
 * All shell names including "Random" at index 0.
 * "Random" is skipped by randomShellName via the index formula.
 */
export const shellNames: readonly string[] = ["Random", ...Object.keys(namedShellTypes)];

// ---------------------------------------------------------------------------
// Shell selection helpers
// ---------------------------------------------------------------------------

export function randomShellName(): string {
  return Math.random() < 0.5
    ? "Crysanthemum"
    : shellNames[(Math.random() * (shellNames.length - 1) + 1) | 0];
}

export function configuredShellName(state: FireworksState): string {
  const selected = shellNameSelector(state);
  return selected in namedShellTypes ? selected : "Random";
}

/**
 * Pure random shell — needs device context for IS_HEADER check.
 * When IS_HEADER, delegates to randomFastShell.
 */
export function randomShell(
  size: number,
  quality: QualityLevel,
  ctx: ShellContext,
  runtime: ShellRuntime,
): ShellOptions {
  if (ctx.isHeader) {
    return randomFastShell(ctx)(size, quality, runtime);
  }
  return namedShellTypes[randomShellName()](size, quality, runtime);
}

/**
 * Returns a ShellFactory for a random fast (non-blacklisted) shell.
 */
export function randomFastShell(ctx: ShellContext): ShellFactory {
  const isRandomShell = shellNameSelector(ctx.state) === "Random";
  let shellName = isRandomShell ? randomShellName() : configuredShellName(ctx.state);

  if (isRandomShell) {
    while (fastShellBlacklist.includes(shellName)) {
      shellName = randomShellName();
    }
  }

  return namedShellTypes[shellName] ?? crysanthemumShell;
}

/**
 * Returns a ShellFactory for the currently configured shell type,
 * falling back to randomShell when the selection is "Random".
 */
export function shellFromConfig(
  size: number,
  quality: QualityLevel,
  ctx: ShellContext,
  runtime: ShellRuntime,
): ShellOptions {
  const name = configuredShellName(ctx.state);
  if (name === "Random") {
    return randomShell(size, quality, ctx, runtime);
  }
  return namedShellTypes[name](size, quality, runtime);
}

// ---------------------------------------------------------------------------
// Position helpers
// ---------------------------------------------------------------------------

export function fitShellPositionInBoundsH(position: number): number {
  const edge = 0.18;
  return (1 - edge * 2) * position + edge;
}

export function fitShellPositionInBoundsV(position: number): number {
  return position * 0.75;
}

export function getRandomShellPositionH(): number {
  return fitShellPositionInBoundsH(Math.random());
}

export function getRandomShellPositionV(): number {
  return fitShellPositionInBoundsV(Math.random());
}

export function getRandomShellSize(state: FireworksState): ShellPositionResult {
  const baseSize = shellSizeSelector(state);
  const maxVariance = Math.min(2.5, baseSize);
  const variance = Math.random() * maxVariance;
  const size = baseSize - variance;
  const height = maxVariance === 0 ? Math.random() : 1 - variance / maxVariance;
  const centerOffset = Math.random() * (1 - height * 0.65) * 0.5;
  const x = Math.random() < 0.5 ? 0.5 - centerOffset : 0.5 + centerOffset;

  return {
    size,
    x: fitShellPositionInBoundsH(x),
    height: fitShellPositionInBoundsV(height),
  };
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

// ---------------------------------------------------------------------------
// Start sequence (main entry point)
// ---------------------------------------------------------------------------

export function startSequence(ctx: SequenceContext): number {
  const rt = ctx.runtime;

  if (rt.isFirstSeq) {
    rt.isFirstSeq = false;
    if (ctx.isHeader) {
      return seqTwoRandom(ctx);
    }

    new ctx.shellCtor(crysanthemumShell(shellSizeSelector(ctx.state), ctx.quality, rt)).launch(
      0.5,
      0.5,
    );
    return 2400;
  }

  if (finaleSelector(ctx.state)) {
    seqRandomFastShell(ctx);
    if (rt.currentFinaleCount < finaleCount) {
      rt.currentFinaleCount += 1;
      return 170;
    }

    rt.currentFinaleCount = 0;
    return 6000;
  }

  const randomValue = Math.random();
  if (randomValue < 0.08 && Date.now() - rt.seqSmallBarrageLastCalled > seqSmallBarrageCooldown) {
    return seqSmallBarrage(ctx);
  }
  if (randomValue < 0.1) {
    return seqPyramid(ctx);
  }
  if (randomValue < 0.6 && !ctx.isHeader) {
    return seqRandomShell(ctx);
  }
  if (randomValue < 0.8) {
    return seqTwoRandom(ctx);
  }

  return seqTriple(ctx);
}
