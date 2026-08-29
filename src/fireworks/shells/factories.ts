import {
  COLOR,
  COLOR_CODES,
  INVISIBLE,
  PI_2,
  QUALITY_LOW,
  QUALITY_HIGH,
} from "@/fireworks/constants";
import type { QualityLevel } from "@/types/app";
import type { ShellRuntime } from "./runtime";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
      ? randomColor(undefined, runtime)
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
