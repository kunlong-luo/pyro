/**
 * Rendering functions for the fireworks simulation.
 * Handles drawing stars, sparks, burst flashes, and speed bar to canvas.
 */

import { COLOR, COLOR_CODES } from "@/fireworks/constants";
import { RENDER } from "@/config/physics";
import { scaleFactorSelector } from "@/fireworks/selectors";
import { colorSky, shouldColorSky } from "../skyLighting";
import { Star, Spark, BurstFlash } from "../particles/pools";
import type { FireworksState } from "@/stores/fireworksStore";
import type { Stage } from "@/lib/stage";

export interface RenderDeps {
  getState: () => FireworksState;
  trailsStage: Stage;
  mainStage: Stage;
  canvasContainer: HTMLElement;
  currentSpeedBarOpacity: number;
  currentSimSpeed: number;
  currentIsHighQuality: boolean;
}

// Static gradient cache for BurstFlash (avoids recreating gradients each frame)
const burstGradientCache = new Map<number, CanvasGradient>();

export function render(deps: RenderDeps, speed: number, width: number, height: number): void {
  const { dpr } = deps.trailsStage;
  const trailsContext = deps.trailsStage.ctx;
  const mainContext = deps.mainStage.ctx;

  if (shouldColorSky(deps)) {
    colorSky(deps, speed);
  }

  const scaleFactor = scaleFactorSelector(deps.getState());
  trailsContext.scale(dpr * scaleFactor, dpr * scaleFactor);
  mainContext.scale(dpr * scaleFactor, dpr * scaleFactor);

  trailsContext.globalCompositeOperation = "source-over";
  trailsContext.fillStyle = `rgba(0, 0, 0, ${deps.getState().config.longExposure ? RENDER.longExposureTrailAlpha : RENDER.normalTrailAlphaFactor * speed})`;
  trailsContext.fillRect(0, 0, width, height);
  mainContext.clearRect(0, 0, width, height);

  while (BurstFlash.active.length) {
    const flash = BurstFlash.active.pop()!;
    // Cache radial gradient by radius to avoid recreating each frame
    let burstGradient = burstGradientCache.get(flash.radius);
    if (!burstGradient) {
      burstGradient = trailsContext.createRadialGradient(0, 0, 0, 0, 0, flash.radius);
      burstGradient.addColorStop(
        RENDER.burstGradientStops[0].stop,
        RENDER.burstGradientStops[0].color,
      );
      burstGradient.addColorStop(
        RENDER.burstGradientStops[1].stop,
        RENDER.burstGradientStops[1].color,
      );
      burstGradient.addColorStop(
        RENDER.burstGradientStops[2].stop,
        RENDER.burstGradientStops[2].color,
      );
      burstGradient.addColorStop(
        RENDER.burstGradientStops[3].stop,
        RENDER.burstGradientStops[3].color,
      );
      burstGradientCache.set(flash.radius, burstGradient);
    }
    // Translate gradient to flash position
    if (typeof trailsContext.save === "function") {
      trailsContext.save();
    }
    trailsContext.translate(flash.x, flash.y);
    trailsContext.fillStyle = burstGradient;
    trailsContext.fillRect(-flash.radius, -flash.radius, flash.radius * 2, flash.radius * 2);
    if (typeof trailsContext.restore === "function") {
      trailsContext.restore();
    }
    BurstFlash.returnInstance(flash);
  }

  trailsContext.globalCompositeOperation = "lighten";

  trailsContext.lineWidth = RENDER.lineWidth;
  trailsContext.lineCap = deps.currentIsHighQuality ? "round" : "square";
  mainContext.strokeStyle = "#fff";
  mainContext.lineWidth = 1;
  mainContext.beginPath();

  for (const colorCode of COLOR_CODES) {
    const stars = Star.active[colorCode];
    trailsContext.strokeStyle = colorCode;
    trailsContext.beginPath();

    for (const star of stars) {
      if (!star.visible) {
        continue;
      }

      trailsContext.lineWidth = star.size;
      trailsContext.moveTo(star.x, star.y);
      trailsContext.lineTo(star.prevX, star.prevY);
      mainContext.moveTo(star.x, star.y);
      mainContext.lineTo(
        star.x - star.speedX * RENDER.starTrailLineMultiplier,
        star.y - star.speedY * RENDER.starTrailLineMultiplier,
      );
    }

    trailsContext.stroke();
  }

  mainContext.stroke();

  trailsContext.lineWidth = Spark.drawWidth;
  trailsContext.lineCap = "butt";
  for (const colorCode of COLOR_CODES) {
    const sparks = Spark.active[colorCode];
    trailsContext.strokeStyle = colorCode;
    trailsContext.beginPath();
    for (const spark of sparks) {
      trailsContext.moveTo(spark.x, spark.y);
      trailsContext.lineTo(spark.prevX, spark.prevY);
    }
    trailsContext.stroke();
  }

  if (deps.currentSpeedBarOpacity) {
    const speedBarHeight = RENDER.speedBarHeight;
    mainContext.globalAlpha = deps.currentSpeedBarOpacity;
    mainContext.fillStyle = COLOR.Blue;
    mainContext.fillRect(0, height - speedBarHeight, width * deps.currentSimSpeed, speedBarHeight);
    mainContext.globalAlpha = 1;
  }

  trailsContext.setTransform(1, 0, 0, 1, 0, 0);
  mainContext.setTransform(1, 0, 0, 1, 0, 0);
}
