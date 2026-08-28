/**
 * Shared constants extracted from runtime.js (1:1 port).
 *
 * Gravity, canvas limits, quality / sky-lighting enums, colour palette,
 * derived colour arrays, and trigonometric helpers.
 */

import { fireworksAppConfig } from "@/config/appConfig";

// ---------------------------------------------------------------------------
// Physics & canvas limits
// ---------------------------------------------------------------------------

export const GRAVITY = 0.9;
export const MAX_WIDTH = 7680;
export const MAX_HEIGHT = 4320;

// ---------------------------------------------------------------------------
// Quality levels (from appConfig)
// ---------------------------------------------------------------------------

export const QUALITY_LOW = fireworksAppConfig.qualityLevels.low;
export const QUALITY_NORMAL = fireworksAppConfig.qualityLevels.normal;
export const QUALITY_HIGH = fireworksAppConfig.qualityLevels.high;

// ---------------------------------------------------------------------------
// Sky lighting modes (from appConfig)
// ---------------------------------------------------------------------------

export const SKY_LIGHT_NONE = fireworksAppConfig.skyLightingModes.none;
export const SKY_LIGHT_DIM = fireworksAppConfig.skyLightingModes.dim;
export const SKY_LIGHT_NORMAL = fireworksAppConfig.skyLightingModes.normal;

// ---------------------------------------------------------------------------
// Colour palette
// ---------------------------------------------------------------------------

export const COLOR = {
  Red: "#ff0043",
  Green: "#14fc56",
  Blue: "#1e7fff",
  Purple: "#e60aff",
  Gold: "#ffbf36",
  White: "#ffffff",
} as const;

export const GOLD = COLOR.Gold;

export const INVISIBLE = "_INVISIBLE_";

// ---------------------------------------------------------------------------
// Trigonometric helpers
// ---------------------------------------------------------------------------

export const PI_2 = Math.PI * 2;
export const PI_HALF = Math.PI * 0.5;

// ---------------------------------------------------------------------------
// Derived colour arrays
// ---------------------------------------------------------------------------

export const COLOR_CODES = Object.values(COLOR);

export const COLOR_CODES_W_INVIS = [...COLOR_CODES, INVISIBLE];

export const COLOR_TUPLES: Record<string, { r: number; g: number; b: number }> = COLOR_CODES.reduce(
  (tuples, colorCode) => {
    tuples[colorCode] = {
      r: Number.parseInt(colorCode.slice(1, 3), 16),
      g: Number.parseInt(colorCode.slice(3, 5), 16),
      b: Number.parseInt(colorCode.slice(5, 7), 16),
    };
    return tuples;
  },
  {} as Record<string, { r: number; g: number; b: number }>,
);
