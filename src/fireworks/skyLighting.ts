/**
 * Sky lighting / background color calculation for the fireworks simulation.
 * Computes sky color based on active particles and applies to container.
 */

import { COLOR_CODES, COLOR_TUPLES, SKY_LIGHT_NONE } from "@/fireworks/constants";
import { skyLightingSelector } from "@/fireworks/selectors";
import type { FireworksState } from "@/stores/fireworksStore";
import { Star } from "./particles/pools";

export interface SkyLightingDeps {
  getState: () => FireworksState;
  canvasContainer: HTMLElement;
}

// Module-level state for sky color interpolation (mutated in-place, not reassigned)
// eslint-disable-next-line prefer-const
let currentSkyColor = { r: 0, g: 0, b: 0 };
// eslint-disable-next-line prefer-const
let targetSkyColor = { r: 0, g: 0, b: 0 };

export function colorSky(deps: SkyLightingDeps, speed: number): void {
  const maxSkySaturation = skyLightingSelector(deps.getState()) * 15;
  const maxStarCount = 500;
  let totalStarCount = 0;

  targetSkyColor.r = 0;
  targetSkyColor.g = 0;
  targetSkyColor.b = 0;

  for (const colorCode of COLOR_CODES) {
    const tuple = COLOR_TUPLES[colorCode];
    const count = Star.active[colorCode].length;
    totalStarCount += count;
    targetSkyColor.r += tuple.r * count;
    targetSkyColor.g += tuple.g * count;
    targetSkyColor.b += tuple.b * count;
  }

  const intensity = Math.pow(Math.min(1, totalStarCount / maxStarCount), 0.3);
  const maxColorComponent = Math.max(1, targetSkyColor.r, targetSkyColor.g, targetSkyColor.b);

  targetSkyColor.r = (targetSkyColor.r / maxColorComponent) * maxSkySaturation * intensity;
  targetSkyColor.g = (targetSkyColor.g / maxColorComponent) * maxSkySaturation * intensity;
  targetSkyColor.b = (targetSkyColor.b / maxColorComponent) * maxSkySaturation * intensity;

  const colorChange = 10;
  currentSkyColor.r += ((targetSkyColor.r - currentSkyColor.r) / colorChange) * speed;
  currentSkyColor.g += ((targetSkyColor.g - currentSkyColor.g) / colorChange) * speed;
  currentSkyColor.b += ((targetSkyColor.b - currentSkyColor.b) / colorChange) * speed;

  deps.canvasContainer.style.backgroundColor = `rgb(${currentSkyColor.r | 0}, ${currentSkyColor.g | 0}, ${currentSkyColor.b | 0})`;
}

export function shouldColorSky(deps: SkyLightingDeps): boolean {
  return skyLightingSelector(deps.getState()) !== SKY_LIGHT_NONE;
}
