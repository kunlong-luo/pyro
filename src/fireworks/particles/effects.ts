/**
 * Burst effect functions for the fireworks simulation.
 * Each effect creates specific particle patterns when a star dies.
 */

import { COLOR, INVISIBLE, PI_2, PI_HALF } from "@/fireworks/constants";
import { Star, Spark, BurstFlash, createParticleArc, createBurst } from "./pools";
import type { StarInstance } from "./pools";

// Effect functions need access to pools and deps - these will be passed in
export interface EffectDeps {
  Star: typeof Star;
  Spark: typeof Spark;
  BurstFlash: typeof BurstFlash;
  createParticleArc: typeof createParticleArc;
  createBurst: typeof createBurst;
  soundManager: { playSound: (type: string, scale?: number) => void };
  currentQuality: number;
  currentIsHighQuality: boolean;
  randomColor: () => string;
}

export function crossetteEffect(deps: EffectDeps, star: StarInstance): void {
  const startAngle = Math.random() * PI_HALF;
  deps.createParticleArc(startAngle, PI_2, 4, 0.5, (angle) => {
    deps.Star.add(star.x, star.y, star.color, angle, Math.random() * 0.6 + 0.75, 600);
  });
}

export function floralEffect(deps: EffectDeps, star: StarInstance): void {
  const count = 12 + 6 * deps.currentQuality;
  deps.createBurst(count, (angle, speedMultiplier) => {
    deps.Star.add(
      star.x,
      star.y,
      star.color,
      angle,
      speedMultiplier * 2.4,
      1000 + Math.random() * 300,
      star.speedX,
      star.speedY,
    );
  });
  deps.BurstFlash.add(star.x, star.y, 46);
  deps.soundManager.playSound("burstSmall");
}

export function fallingLeavesEffect(deps: EffectDeps, star: StarInstance): void {
  deps.createBurst(7, (angle, speedMultiplier) => {
    const newStar = deps.Star.add(
      star.x,
      star.y,
      INVISIBLE,
      angle,
      speedMultiplier * 2.4,
      2400 + Math.random() * 600,
      star.speedX,
      star.speedY,
    );
    newStar.sparkColor = COLOR.Gold;
    newStar.sparkFreq = 144 / deps.currentQuality;
    newStar.sparkSpeed = 0.28;
    newStar.sparkLife = 750;
    newStar.sparkLifeVariation = 3.2;
  });
  deps.BurstFlash.add(star.x, star.y, 46);
  deps.soundManager.playSound("burstSmall");
}

export function crackleEffect(deps: EffectDeps, star: StarInstance): void {
  const count = deps.currentIsHighQuality ? 32 : 16;
  deps.createParticleArc(0, PI_2, count, 1.8, (angle) => {
    deps.Spark.add(
      star.x,
      star.y,
      COLOR.Gold,
      angle,
      Math.pow(Math.random(), 0.45) * 2.4,
      300 + Math.random() * 200,
    );
  });
}