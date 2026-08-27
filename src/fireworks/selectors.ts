/**
 * State-selector functions extracted from runtime.js (1:1 port).
 *
 * Every selector accepts an explicit FireworksState so it can be called
 * with either the live store state or a snapshot passed during comparison.
 */

import type { FireworksState } from "@/stores/fireworksStore";

// ---------------------------------------------------------------------------
// Running / sound
// ---------------------------------------------------------------------------

export function isRunning(state: FireworksState): boolean {
  return !state.paused && !state.menuOpen;
}

export function soundEnabledSelector(state: FireworksState): boolean {
  return state.soundEnabled;
}

export function canPlaySoundSelector(state: FireworksState): boolean {
  return isRunning(state) && soundEnabledSelector(state);
}

// ---------------------------------------------------------------------------
// Config selectors
// ---------------------------------------------------------------------------

export function qualitySelector(state: FireworksState): number {
  return Number(state.config.quality);
}

export function shellNameSelector(state: FireworksState): string {
  return state.config.shell;
}

export function shellSizeSelector(state: FireworksState): number {
  return Number(state.config.size);
}

export function finaleSelector(state: FireworksState): boolean {
  return state.config.finale;
}

export function skyLightingSelector(state: FireworksState): number {
  return Number(state.config.skyLighting);
}

export function scaleFactorSelector(state: FireworksState): number {
  return state.config.scaleFactor;
}
