/**
 * Rendering functions for the fireworks simulation.
 * Handles drawing stars, sparks, burst flashes, and speed bar to canvas.
 */

import { COLOR, COLOR_CODES } from "@/fireworks/constants";
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
  trailsContext.fillStyle = `rgba(0, 0, 0, ${deps.getState().config.longExposure ? 0.0025 : 0.175 * speed})`;
  trailsContext.fillRect(0, 0, width, height);
  mainContext.clearRect(0, 0, width, height);

  while (BurstFlash.active.length) {
    const flash = BurstFlash.active.pop()!;
    const burstGradient = trailsContext.createRadialGradient(
      flash.x,
      flash.y,
      0,
      flash.x,
      flash.y,
      flash.radius,
    );
    burstGradient.addColorStop(0.024, "rgba(255, 255, 255, 1)");
    burstGradient.addColorStop(0.125, "rgba(255, 160, 20, 0.2)");
    burstGradient.addColorStop(0.32, "rgba(255, 140, 20, 0.11)");
    burstGradient.addColorStop(1, "rgba(255, 120, 20, 0)");
    trailsContext.fillStyle = burstGradient;
    trailsContext.fillRect(
      flash.x - flash.radius,
      flash.y - flash.radius,
      flash.radius * 2,
      flash.radius * 2,
    );
    BurstFlash.returnInstance(flash);
  }

  trailsContext.globalCompositeOperation = "lighten";

  trailsContext.lineWidth = 3;
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
      mainContext.lineTo(star.x - star.speedX * 1.6, star.y - star.speedY * 1.6);
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
    const speedBarHeight = 6;
    mainContext.globalAlpha = deps.currentSpeedBarOpacity;
    mainContext.fillStyle = COLOR.Blue;
    mainContext.fillRect(0, height - speedBarHeight, width * deps.currentSimSpeed, speedBarHeight);
    mainContext.globalAlpha = 1;
  }

  trailsContext.setTransform(1, 0, 0, 1, 0, 0);
  mainContext.setTransform(1, 0, 0, 1, 0, 0);
}