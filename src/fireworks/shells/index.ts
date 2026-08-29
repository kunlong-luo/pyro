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

import { finaleSelector, shellSizeSelector } from "@/fireworks/selectors";
import { crysanthemumShell } from "./factories";
import {
  seqRandomFastShell,
  seqRandomShell,
  seqTwoRandom,
  seqTriple,
  seqPyramid,
  seqSmallBarrage,
} from "./sequences";
import { seqSmallBarrageCooldown } from "./selection";
import type { SequenceContext } from "./sequences";

// ---------------------------------------------------------------------------
// Re-export runtime
// ---------------------------------------------------------------------------

export type { ShellRuntime } from "./runtime";
export { createShellRuntime } from "./runtime";

// ---------------------------------------------------------------------------
// Re-export factories
// ---------------------------------------------------------------------------

export type { ShellOptions, ShellInstance, ShellCtor, ShellFactory } from "./factories";
export {
  randomColor,
  randomWord,
  whiteOrGold,
  makePistilColor,
  crysanthemumShell,
  ghostShell,
  strobeShell,
  palmShell,
  ringShell,
  crossetteShell,
  floralShell,
  fallingLeavesShell,
  willowShell,
  crackleShell,
  horsetailShell,
  namedShellTypes,
  shellNames,
} from "./factories";

// ---------------------------------------------------------------------------
// Re-export selection
// ---------------------------------------------------------------------------

export type { ShellPositionResult, ShellContext } from "./selection";
export {
  randomShellName,
  configuredShellName,
  randomShell,
  randomFastShell,
  shellFromConfig,
  fitShellPositionInBoundsH,
  fitShellPositionInBoundsV,
  getRandomShellPositionH,
  getRandomShellPositionV,
  getRandomShellSize,
  fastShellBlacklist,
  seqSmallBarrageCooldown,
} from "./selection";

// ---------------------------------------------------------------------------
// Re-export sequences
// ---------------------------------------------------------------------------

export type { SequenceContext, LaunchEvent } from "./sequences";
export {
  launchShellFromConfig,
  seqRandomShell,
  seqRandomFastShell,
  seqTwoRandom,
  seqTriple,
  seqPyramid,
  seqSmallBarrage,
} from "./sequences";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const finaleCount = 32;

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
