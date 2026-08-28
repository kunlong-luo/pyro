/**
 * Particle pools for the fireworks simulation.
 * Manages Star, Spark, and BurstFlash object pools with reuse.
 */

import {
  COLOR_CODES,
  COLOR_CODES_W_INVIS,
  PI_2,
} from "@/fireworks/constants";
import { MyMath } from "@/lib/math";
import type { LatticeResult } from "@/lib/math";

// ---------------------------------------------------------------------------
// Particle instance types
// ---------------------------------------------------------------------------

/** A single star particle in the simulation. */
export interface StarInstance {
  visible: boolean;
  heavy: boolean;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  color: string;
  speedX: number;
  speedY: number;
  life: number;
  fullLife: number;
  size: number;
  spinAngle: number;
  spinSpeed: number;
  sparkFreq: number;
  sparkSpeed: number;
  sparkTimer: number;
  sparkColor: string;
  sparkLife: number;
  sparkLifeVariation: number;
  spinRadius: number;
  strobe: boolean;
  strobeFreq?: number;
  onDeath: ((star: StarInstance) => void) | null;
  secondColor: string | null;
  transitionTime: number;
  colorChanged: boolean;
  updateFrame: number;
}

/** A single spark particle in the simulation. */
export interface SparkInstance {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  color: string;
  speedX: number;
  speedY: number;
  life: number;
}

/** A single burst-flash instance. */
export interface BurstFlashInstance {
  x: number;
  y: number;
  radius: number;
}

/** Map of color-code string to particle array. */
export type ParticleCollection<T> = Record<string, T[]>;

// ---------------------------------------------------------------------------
// Pool helpers
// ---------------------------------------------------------------------------

function createParticleCollection<T>(): ParticleCollection<T> {
  const collection: ParticleCollection<T> = {} as ParticleCollection<T>;
  for (const colorCode of COLOR_CODES_W_INVIS) {
    collection[colorCode] = [];
  }
  return collection;
}

// ---------------------------------------------------------------------------
// BurstFlash pool
// ---------------------------------------------------------------------------

export const BurstFlash = {
  active: [] as BurstFlashInstance[],
  _pool: [] as BurstFlashInstance[],

  _new(): BurstFlashInstance {
    return {} as BurstFlashInstance;
  },

  add(x: number, y: number, radius: number): BurstFlashInstance {
    const instance = this._pool.pop() || this._new();
    instance.x = x;
    instance.y = y;
    instance.radius = radius;
    this.active.push(instance);
    return instance;
  },

  returnInstance(instance: BurstFlashInstance): void {
    this._pool.push(instance);
  },
};

// ---------------------------------------------------------------------------
// Star pool
// ---------------------------------------------------------------------------

export const Star = {
  airDrag: 0.98,
  airDragHeavy: 0.992,
  active: createParticleCollection<StarInstance>(),
  _pool: [] as StarInstance[],

  _new(): StarInstance {
    return {} as StarInstance;
  },

  add(
    x: number,
    y: number,
    color: string,
    angle: number,
    speed: number,
    life: number,
    speedOffsetX?: number,
    speedOffsetY?: number,
    size = 3,
  ): StarInstance {
    const instance = this._pool.pop() || this._new();
    instance.visible = true;
    instance.heavy = false;
    instance.x = x;
    instance.y = y;
    instance.prevX = x;
    instance.prevY = y;
    instance.color = color;
    instance.speedX = Math.sin(angle) * speed + (speedOffsetX || 0);
    instance.speedY = Math.cos(angle) * speed + (speedOffsetY || 0);
    instance.life = life;
    instance.fullLife = life;
    instance.size = size;
    instance.spinAngle = Math.random() * PI_2;
    instance.spinSpeed = 0.8;
    instance.spinRadius = 0;
    instance.sparkFreq = 0;
    instance.sparkSpeed = 1;
    instance.sparkTimer = 0;
    instance.sparkColor = color;
    instance.sparkLife = 750;
    instance.sparkLifeVariation = 0.25;
    instance.strobe = false;
    instance.strobeFreq = undefined;
    instance.onDeath = null;
    instance.secondColor = null;
    instance.transitionTime = 0;
    instance.colorChanged = false;
    instance.updateFrame = 0;
    this.active[color].push(instance);
    return instance;
  },

  returnInstance(instance: StarInstance): void {
    if (instance.onDeath) {
      instance.onDeath(instance);
    }
    instance.onDeath = null;
    instance.secondColor = null;
    instance.transitionTime = 0;
    instance.colorChanged = false;
    this._pool.push(instance);
  },
};

// ---------------------------------------------------------------------------
// Spark pool
// ---------------------------------------------------------------------------

export const Spark = {
  drawWidth: 0,
  airDrag: 0.9,
  active: createParticleCollection<SparkInstance>(),
  _pool: [] as SparkInstance[],

  _new(): SparkInstance {
    return {} as SparkInstance;
  },

  add(
    x: number,
    y: number,
    color: string,
    angle: number,
    speed: number,
    life: number,
  ): SparkInstance {
    const instance = this._pool.pop() || this._new();
    instance.x = x;
    instance.y = y;
    instance.prevX = x;
    instance.prevY = y;
    instance.color = color;
    instance.speedX = Math.sin(angle) * speed;
    instance.speedY = Math.cos(angle) * speed;
    instance.life = life;
    this.active[color].push(instance);
    return instance;
  },

  returnInstance(instance: SparkInstance): void {
    this._pool.push(instance);
  },
};

// ---------------------------------------------------------------------------
// Random colour (simple version — no notSame/notColor logic)
// ---------------------------------------------------------------------------

export function randomColor(): string {
  return COLOR_CODES[(Math.random() * COLOR_CODES.length) | 0];
}

// ---------------------------------------------------------------------------
// createParticleArc
// ---------------------------------------------------------------------------

export function createParticleArc(
  start: number,
  arcLength: number,
  count: number,
  randomness: number,
  particleFactory: (angle: number) => void,
): void {
  const angleDelta = arcLength / count;
  const end = start + arcLength - angleDelta * 0.5;

  if (end > start) {
    for (let angle = start; angle < end; angle = angle + angleDelta) {
      particleFactory(angle + Math.random() * angleDelta * randomness);
    }
    return;
  }

  for (let angle = start; angle > end; angle = angle + angleDelta) {
    particleFactory(angle + Math.random() * angleDelta * randomness);
  }
}

// ---------------------------------------------------------------------------
// getWordDots
// ---------------------------------------------------------------------------

const wordDotCache = new Map<string, LatticeResult>();

export function getWordDots(
  word: string,
  wordFontSizeMin: number,
  wordFontSizeMax: number,
  wordPointDensity: number,
  wordFontFamily: string,
): LatticeResult | null {
  if (!word) {
    return null;
  }

  const fontSize = MyMath.randomInt(wordFontSizeMin, wordFontSizeMax);
  const cacheKey = `${word}:${fontSize}`;
  if (!wordDotCache.has(cacheKey)) {
    wordDotCache.set(
      cacheKey,
      MyMath.literalLattice(word, wordPointDensity, wordFontFamily, `${fontSize}px`),
    );
  }

  return wordDotCache.get(cacheKey)!;
}

// ---------------------------------------------------------------------------
// createBurst
// ---------------------------------------------------------------------------

export function createBurst(
  count: number,
  particleFactory: (angle: number, speedMultiplier: number) => void,
  startAngle = 0,
  arcLength = PI_2,
): void {
  const radius = 0.5 * Math.sqrt(count / Math.PI);
  const circumference = 2 * radius * Math.PI;
  const halfCircumference = circumference / 2;

  for (let ringIndex = 0; ringIndex <= halfCircumference; ringIndex += 1) {
    const ringAngle = (ringIndex / halfCircumference) * (Math.PI * 0.5);
    const ringSize = Math.cos(ringAngle);
    const partsPerFullRing = circumference * ringSize;
    const partsPerArc = partsPerFullRing * (arcLength / PI_2);
    const angleIncrement = PI_2 / partsPerFullRing;
    const angleOffset = Math.random() * angleIncrement + startAngle;
    const maxRandomAngleOffset = angleIncrement * 0.33;

    for (let particleIndex = 0; particleIndex < partsPerArc; particleIndex += 1) {
      const randomAngleOffset = Math.random() * maxRandomAngleOffset;
      const angle = angleIncrement * particleIndex + angleOffset + randomAngleOffset;
      particleFactory(angle, ringSize);
    }
  }
}

// ---------------------------------------------------------------------------
// createWordBurst
// ---------------------------------------------------------------------------

export function createWordBurst(
  wordText: string,
  particleFactory: (
    point: { x: number; y: number },
    color: string,
    strobe: boolean,
    strobeColor: string,
  ) => void,
  centerX: number,
  centerY: number,
  wordFontSizeMin: number,
  wordFontSizeMax: number,
  wordPointDensity: number,
  wordFontFamily: string,
): void {
  const map = getWordDots(wordText, wordFontSizeMin, wordFontSizeMax, wordPointDensity, wordFontFamily);
  if (!map) {
    return;
  }

  const centerOffsetX = map.width / 2;
  const centerOffsetY = map.height / 2;
  const color = randomColor();
  const strobed = Math.random() < 0.5;
  const strobeColor = strobed ? randomColor() : color;

  for (let index = 0; index < map.points.length; index += 1) {
    const point = map.points[index];
    particleFactory(
      {
        x: centerX + (point.x - centerOffsetX),
        y: centerY + (point.y - centerOffsetY),
      },
      color,
      strobed,
      strobeColor,
    );
  }
}