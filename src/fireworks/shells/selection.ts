import { shellNameSelector, shellSizeSelector } from "@/fireworks/selectors";
import type { FireworksState } from "@/stores/fireworksStore";
import type { QualityLevel } from "@/types/app";
import type { ShellRuntime } from "./runtime";
import type { ShellFactory } from "./factories";
import { namedShellTypes, crysanthemumShell, shellNames } from "./factories";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const fastShellBlacklist = ["Falling Leaves", "Floral", "Willow"];
export const seqSmallBarrageCooldown = 15000;

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
): import("./factories").ShellOptions {
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
): import("./factories").ShellOptions {
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
