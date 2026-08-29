/**
 * Physics and simulation constants — single source of truth.
 *
 * All values are ported 1:1 from inline magic numbers across
 * simulation.ts, pools.ts, skyLighting.ts, render.ts, and interaction.ts.
 *
 * The existing `GRAVITY`, `MAX_WIDTH`, `MAX_HEIGHT` in `@/fireworks/constants`
 * are re-exported here so consumers can import the full physics domain from
 * one place.  constants.ts itself is left untouched.
 */

import { GRAVITY, MAX_WIDTH, MAX_HEIGHT } from "@/fireworks/constants";

export { GRAVITY, MAX_WIDTH, MAX_HEIGHT };

// ---------------------------------------------------------------------------
// Air drag coefficients
// ---------------------------------------------------------------------------

export const AIR_DRAG = Object.freeze({
  /** Light star particle air drag. */
  star: 0.98,
  /** Heavy star particle (comet trail) air drag. */
  starHeavy: 0.992,
  /** Spark particle air drag. */
  spark: 0.9,
} as const);

// ---------------------------------------------------------------------------
// Launch geometry
// ---------------------------------------------------------------------------

export const LAUNCH = Object.freeze({
  /** Horizontal padding from canvas edge (px). */
  horizontalPadding: 60,
  /** Vertical padding from canvas top (px). */
  verticalPadding: 50,
  /** Minimum burst height as fraction of canvas height. */
  minimumHeightPercent: 0.45,
  /** Launch velocity distance factor. */
  velocityFactor: 0.04,
  /** Launch velocity exponent. */
  velocityExponent: 0.64,
} as const);

// ---------------------------------------------------------------------------
// Burst parameters
// ---------------------------------------------------------------------------

export const BURST = Object.freeze({
  /** Divisor for spreadSize → burst speed. */
  spreadSizeDivider: 96,
  /** Divisor for spreadSize → initial star speed. */
  initialSpeedDivider: 1800,
  /** Divisor for spreadSize² → star count (density formula). */
  densityDivider: 54,
  /** Minimum star count per burst. */
  starCountMin: 6,
  /** Divisor for spreadSize → burst flash radius. */
  flashRadiusDivider: 4,
} as const);

// ---------------------------------------------------------------------------
// Comet (launch trail) defaults
// ---------------------------------------------------------------------------

export const COMET = Object.freeze({
  /** Spark frequency in high-quality mode. */
  sparkFreqHighQuality: 8,
  /** Spark frequency base in normal mode (divided by quality). */
  sparkFreqBase: 32,
  /** Default spark life for comet trail (ms). */
  sparkLife: 320,
  /** Default spark life variation for comet trail. */
  sparkLifeVariation: 3,
  /** Spark frequency base for willow/fallingLeaves comet (divided by quality). */
  willowSparkFreqBase: 20,
  /** Spark speed override for willow/fallingLeaves comet. */
  willowSparkSpeed: 0.5,
  /** Spark life override for willow/fallingLeaves comet (ms). */
  willowSparkLife: 500,
} as const);

// ---------------------------------------------------------------------------
// Glitter configuration (burst phase)
// ---------------------------------------------------------------------------

export const GLITTER = Object.freeze({
  light: Object.freeze({
    sparkFreq: 400,
    sparkSpeed: 0.3,
    sparkLife: 300,
    sparkLifeVariation: 2,
  }),
  medium: Object.freeze({
    sparkFreq: 200,
    sparkSpeed: 0.44,
    sparkLife: 700,
    sparkLifeVariation: 2,
  }),
  heavy: Object.freeze({
    sparkFreq: 80,
    sparkSpeed: 0.8,
    sparkLife: 1400,
    sparkLifeVariation: 2,
  }),
  thick: Object.freeze({
    sparkFreq: 16,
    sparkSpeedHQ: 1.65,
    sparkSpeedNormal: 1.5,
    sparkLife: 1400,
    sparkLifeVariation: 3,
  }),
  streamer: Object.freeze({
    sparkFreq: 32,
    sparkSpeed: 1.05,
    sparkLife: 620,
    sparkLifeVariation: 2,
  }),
  willow: Object.freeze({
    sparkFreq: 120,
    sparkSpeed: 0.34,
    sparkLife: 1400,
    sparkLifeVariation: 3.8,
  }),
} as const);

// ---------------------------------------------------------------------------
// Spark / star particle defaults
// ---------------------------------------------------------------------------

export const PARTICLE = Object.freeze({
  /** Default spark frequency (0 = off). */
  defaultSparkFreq: 0,
  /** Default spark speed multiplier. */
  defaultSparkSpeed: 1,
  /** Default spark life (ms). */
  defaultSparkLife: 750,
  /** Default spark life variation factor. */
  defaultSparkLifeVariation: 0.25,
  /** Default star spin speed. */
  defaultSpinSpeed: 0.8,
  /** Spark timer base multiplier (fraction of sparkFreq). */
  sparkTimerBaseMultiplier: 0.75,
  /** Spark timer burn-rate multiplier. */
  sparkTimerBurnRateMultiplier: 4,
  /** Spark life multiplier applied at emission. */
  sparkLifeMultiplier: 0.8,
} as const);

// ---------------------------------------------------------------------------
// Color transition & strobe timing
// ---------------------------------------------------------------------------

export const TRANSITION = Object.freeze({
  /** Second-color transition time power curve. */
  secondColorPower: 1.5,
  /** Max transition time for second color (ms). */
  secondColorMaxTime: 700,
  /** Min transition time for second color (ms). */
  secondColorMinTime: 500,
  /** Min factor for second-color transition timing. */
  secondColorFactorMin: 0.05,
  /** Max factor for second-color transition timing. */
  secondColorFactorMax: 0.32,
  /** Min factor for strobe transition timing. */
  strobeFactorMin: 0.08,
  /** Max factor for strobe transition timing. */
  strobeFactorMax: 0.46,
  /** Minimum strobe flash frequency (Hz). */
  strobeFreqMin: 40,
  /** Strobe flash frequency random range (Hz). */
  strobeFreqRange: 20,
} as const);

// ---------------------------------------------------------------------------
// Pistil sub-shell
// ---------------------------------------------------------------------------

export const PISTIL = Object.freeze({
  /** Spread size multiplier relative to parent. */
  spreadMultiplier: 0.5,
  /** Star life multiplier relative to parent. */
  lifeMultiplier: 0.6,
  /** Fixed star density for pistil. */
  starDensity: 1.4,
} as const);

// ---------------------------------------------------------------------------
// Streamer sub-shell
// ---------------------------------------------------------------------------

export const STREAMER = Object.freeze({
  /** Spread size multiplier relative to parent. */
  spreadMultiplier: 0.9,
  /** Star life multiplier relative to parent. */
  lifeMultiplier: 0.8,
  /** Divisor for spreadSize → streamer star count. */
  starCountDivider: 45,
} as const);

// ---------------------------------------------------------------------------
// Sky lighting
// ---------------------------------------------------------------------------

export const SKY_LIGHTING = Object.freeze({
  /** Multiplier for sky saturation from lighting selector (0–2). */
  saturationMultiplier: 15,
  /** Max star count for sky intensity normalisation. */
  maxStarCount: 500,
  /** Intensity power-curve exponent. */
  intensityPower: 0.3,
  /** Colour interpolation rate (lower = smoother). */
  colorChangeRate: 10,
} as const);

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export const RENDER = Object.freeze({
  /** Speed bar height (px). */
  speedBarHeight: 6,
  /** Default canvas line width for star trails. */
  lineWidth: 3,
  /** Multiplier for star velocity → trail endpoint offset. */
  starTrailLineMultiplier: 1.6,
  /** Spark draw width in high-quality mode. */
  sparkDrawWidthHighQuality: 0.75,
  /** Spark draw width in normal mode. */
  sparkDrawWidthNormal: 1,
  /** Trail alpha for long-exposure mode. */
  longExposureTrailAlpha: 0.0025,
  /** Trail alpha factor multiplied by speed in normal mode. */
  normalTrailAlphaFactor: 0.175,
  /** Burst flash radial gradient colour stops. */
  burstGradientStops: Object.freeze([
    { stop: 0.024, color: "rgba(255, 255, 255, 1)" },
    { stop: 0.125, color: "rgba(255, 160, 20, 0.2)" },
    { stop: 0.32, color: "rgba(255, 140, 20, 0.11)" },
    { stop: 1, color: "rgba(255, 120, 20, 0)" },
  ] as const),
} as const);

// ---------------------------------------------------------------------------
// Interaction / UI thresholds
// ---------------------------------------------------------------------------

export const INTERACTION = Object.freeze({
  /** Hit-test size for top-bar buttons (px). */
  buttonSize: 50,
  /** Horizontal edge padding for speed slider (px). */
  edgePadding: 16,
  /** Speed-bar opacity decay divisor (higher = slower fade). */
  speedBarOpacityDecayDivisor: 30,
  /** Auto-launch delay multiplier. */
  autoLaunchTimeMultiplier: 1.25,
  /** Y-distance from bottom for speed-bar touch activation (px). */
  speedBarTouchThreshold: 44,
} as const);

// ---------------------------------------------------------------------------
// Sound scaling
// ---------------------------------------------------------------------------

export const SOUND = Object.freeze({
  /** Max size difference for sound scaling. */
  burstMaxSizeDiff: 2,
  /** Min sound scale for burst. */
  burstMinScale: 0.7,
  /** Sound scale range (maxScale = minScale + range). */
  burstScaleRange: 0.3,
} as const);
