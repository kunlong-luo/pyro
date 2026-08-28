import { COLOR, COLOR_CODES_W_INVIS, GRAVITY, INVISIBLE, PI_2 } from "@/fireworks/constants";
import { MyMath } from "@/lib/math";
import { fireworksAppConfig } from "@/config/appConfig";
import type { Stage } from "@/lib/stage";
import type { SoundManager } from "@/fireworks/audio";
import type { WordBurstTracker } from "@/fireworks/wordBurst";
import type { FireworksState } from "@/stores/fireworksStore";
import type { ShellOptions as BaseShellOptions } from "@/fireworks/shells";
import { isRunning, qualitySelector, shellSizeSelector } from "@/fireworks/selectors";
import {
  Star,
  Spark,
  BurstFlash,
  randomColor,
  createParticleArc,
  createBurst,
  createWordBurst,
} from "./particles/pools";
import {
  crossetteEffect,
  floralEffect,
  fallingLeavesEffect,
  crackleEffect,
  type EffectDeps,
} from "./particles/effects";
import { render } from "./render/render";

// ---------------------------------------------------------------------------
// Shell options (extends base with disableWord for sub-shell creation)
// ---------------------------------------------------------------------------

/**
 * Shell configuration accepted by the Shell constructor.
 * Extends BaseShellOptions with `disableWord` (used by sub-shells in burst)
 * and makes `shellSize` optional (sub-shells don't set it).
 */
export interface SimulationShellOptions extends Omit<BaseShellOptions, "shellSize"> {
  shellSize?: number;
  disableWord?: boolean;
}

import type {
  StarInstance,
  SparkInstance,
  BurstFlashInstance,
  ParticleCollection,
} from "./particles/pools";
export type { StarInstance, SparkInstance, BurstFlashInstance, ParticleCollection };

// ---------------------------------------------------------------------------
// Dependency interface
// ---------------------------------------------------------------------------

/**
 * External dependencies the simulation needs from the host application.
 */
export interface SimulationDeps {
  getState: () => FireworksState;
  getSimSpeed: () => number;
  getSpeedBarOpacity: () => number;
  trailsStage: Stage;
  mainStage: Stage;
  soundManager: SoundManager;
  wordBurstTracker: WordBurstTracker;
  canvasContainer: HTMLElement;
}

// ---------------------------------------------------------------------------
// Simulation return type
// ---------------------------------------------------------------------------

export interface Simulation {
  update(frameTime: number, lag: number): void;
  Shell: new (options: SimulationShellOptions) => ShellInstance;
}

// ---------------------------------------------------------------------------
// Shell instance interface (for external use)
// ---------------------------------------------------------------------------

export interface ShellInstance {
  shellSize: number;
  spreadSize: number;
  starLife: number;
  starLifeVariation: number;
  starCount: number;
  color: string | string[];
  secondColor?: string | null;
  glitter?: string;
  glitterColor: string;
  pistil?: boolean;
  pistilColor?: string | false;
  streamers?: boolean;
  ring?: boolean;
  crossette?: boolean;
  floral?: boolean;
  fallingLeaves?: boolean;
  horsetail?: boolean;
  strobe?: boolean;
  strobeColor?: string | null;
  crackle?: boolean;
  starDensity?: number;
  disableWord: boolean;
  forceWordBurst?: boolean;
  comet: StarInstance | null;
  launch(position: number, launchHeight: number): void;
  burst(x: number, y: number): void;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createSimulation(deps: SimulationDeps): Simulation {
  // Closure state (replaces globals)
  let currentFrame = 0;
  let currentQuality = 2;
  let currentIsHighQuality = false;
  let currentWordShellEnabled = false;
  let currentSimSpeed = 1;
  let currentSpeedBarOpacity = 0;

  // Effect deps for burst effects
  const effectDeps: EffectDeps = {
    Star,
    Spark,
    BurstFlash,
    createParticleArc,
    createBurst,
    soundManager: deps.soundManager,
    currentQuality: 2,
    currentIsHighQuality: false,
    randomColor,
  };

  // ---------------------------------------------------------------------------
  // Shell class (defined inside to access closure state)
  // ---------------------------------------------------------------------------

  class Shell implements ShellInstance {
    // All ShellOptions fields (copied via Object.assign in constructor)
    shellSize!: number;
    spreadSize!: number;
    starLife!: number;
    starLifeVariation!: number;
    starCount!: number;
    color!: string | string[];
    secondColor?: string | null;
    glitter?: string;
    glitterColor!: string;
    pistil?: boolean;
    pistilColor?: string | false;
    streamers?: boolean;
    ring?: boolean;
    crossette?: boolean;
    floral?: boolean;
    fallingLeaves?: boolean;
    horsetail?: boolean;
    strobe?: boolean;
    strobeColor?: string | null;
    crackle?: boolean;
    starDensity?: number;

    // Extra fields not in ShellOptions
    disableWord!: boolean;
    forceWordBurst?: boolean;
    comet: StarInstance | null = null;

    constructor(options: SimulationShellOptions) {
      Object.assign(this, options);
      this.starLifeVariation = options.starLifeVariation ?? 0.125;
      this.color = options.color || randomColor();
      this.glitterColor =
        options.glitterColor || (typeof this.color === "string" ? this.color : randomColor());
      this.disableWord = options.disableWord ?? false;

      if (!this.starCount) {
        const density = options.starDensity || 1;
        const scaledSize = this.spreadSize / 54;
        this.starCount = Math.max(6, scaledSize * scaledSize * density);
      }
    }

    launch(position: number, launchHeight: number): void {
      const width = deps.trailsStage.width;
      const height = deps.trailsStage.height;
      const horizontalPadding = 60;
      const verticalPadding = 50;
      const minimumHeightPercent = 0.45;
      const minimumHeight = height - height * minimumHeightPercent;
      const launchX = position * (width - horizontalPadding * 2) + horizontalPadding;
      const launchY = height;
      const burstY = minimumHeight - launchHeight * (minimumHeight - verticalPadding);
      const launchDistance = launchY - burstY;
      const launchVelocity = Math.pow(launchDistance * 0.04, 0.64);

      const comet = (this.comet = Star.add(
        launchX,
        launchY,
        typeof this.color === "string" && this.color !== "random" ? this.color : COLOR.White,
        Math.PI,
        launchVelocity * (this.horsetail ? 1.2 : 1),
        launchVelocity * (this.horsetail ? 100 : 400),
      ));

      comet.heavy = true;
      comet.spinRadius = MyMath.random(0.32, 0.85);
      comet.sparkFreq = currentIsHighQuality ? 8 : 32 / currentQuality;
      comet.sparkLife = 320;
      comet.sparkLifeVariation = 3;

      if (this.glitter === "willow" || this.fallingLeaves) {
        comet.sparkFreq = 20 / currentQuality;
        comet.sparkSpeed = 0.5;
        comet.sparkLife = 500;
      }

      if (this.color === INVISIBLE) {
        comet.sparkColor = COLOR.Gold;
      }

      if (Math.random() > 0.4 && !this.horsetail) {
        comet.secondColor = INVISIBLE;
        comet.transitionTime = Math.pow(Math.random(), 1.5) * 700 + 500;
      }

      comet.onDeath = (activeComet) => this.burst(activeComet.x, activeComet.y);
      deps.soundManager.playSound("lift");
    }

    burst(x: number, y: number): void {
      burstShell(this, x, y);
    }
  }

  // ---------------------------------------------------------------------------
  // Burst logic (uses closure state)
  // ---------------------------------------------------------------------------

  function burstShell(shell: ShellInstance, x: number, y: number): void {
    const speed = shell.spreadSize / 96;
    let color: string | null = null;
    let onDeath: ((star: StarInstance) => void) | undefined;
    let sparkFreq: number | undefined;
    let sparkSpeed: number | undefined;
    let sparkLife: number | undefined;
    let sparkLifeVariation = 0.25;
    let playedDeathSound = false;

    if (shell.crossette) {
      onDeath = (star) => {
        if (!playedDeathSound) {
          deps.soundManager.playSound("crackleSmall");
          playedDeathSound = true;
        }
        crossetteEffect(effectDeps, star);
      };
    }

    if (shell.crackle) {
      onDeath = (star) => {
        if (!playedDeathSound) {
          deps.soundManager.playSound("crackle");
          playedDeathSound = true;
        }
        crackleEffect(effectDeps, star);
      };
    }

    if (shell.floral) {
      onDeath = (star) => floralEffect(effectDeps, star);
    }
    if (shell.fallingLeaves) {
      onDeath = (star) => fallingLeavesEffect(effectDeps, star);
    }

    if (shell.glitter === "light") {
      sparkFreq = 400;
      sparkSpeed = 0.3;
      sparkLife = 300;
      sparkLifeVariation = 2;
    } else if (shell.glitter === "medium") {
      sparkFreq = 200;
      sparkSpeed = 0.44;
      sparkLife = 700;
      sparkLifeVariation = 2;
    } else if (shell.glitter === "heavy") {
      sparkFreq = 80;
      sparkSpeed = 0.8;
      sparkLife = 1400;
      sparkLifeVariation = 2;
    } else if (shell.glitter === "thick") {
      sparkFreq = 16;
      sparkSpeed = currentIsHighQuality ? 1.65 : 1.5;
      sparkLife = 1400;
      sparkLifeVariation = 3;
    } else if (shell.glitter === "streamer") {
      sparkFreq = 32;
      sparkSpeed = 1.05;
      sparkLife = 620;
      sparkLifeVariation = 2;
    } else if (shell.glitter === "willow") {
      sparkFreq = 120;
      sparkSpeed = 0.34;
      sparkLife = 1400;
      sparkLifeVariation = 3.8;
    }

    sparkFreq = (sparkFreq ?? 0) / currentQuality;

    const starFactory = (angle: number, speedMultiplier: number) => {
      const standardInitialSpeed = shell.spreadSize / 1800;
      const star = Star.add(
        x,
        y,
        color || randomColor(),
        angle,
        speedMultiplier * speed,
        shell.starLife + Math.random() * shell.starLife * shell.starLifeVariation,
        shell.horsetail ? shell.comet?.speedX : 0,
        shell.horsetail ? shell.comet?.speedY : -standardInitialSpeed,
      );

      if (shell.secondColor) {
        star.transitionTime = shell.starLife * (Math.random() * 0.05 + 0.32);
        star.secondColor = shell.secondColor;
      }

      if (shell.strobe) {
        star.transitionTime = shell.starLife * (Math.random() * 0.08 + 0.46);
        star.strobe = true;
        star.strobeFreq = Math.random() * 20 + 40;
        if (shell.strobeColor) {
          star.secondColor = shell.strobeColor;
        }
      }

      star.onDeath = onDeath ?? null;

      if (shell.glitter) {
        star.sparkFreq = sparkFreq!;
        star.sparkSpeed = sparkSpeed!;
        star.sparkLife = sparkLife!;
        star.sparkLifeVariation = sparkLifeVariation;
        star.sparkColor = shell.glitterColor;
        star.sparkTimer = Math.random() * star.sparkFreq;
      }
    };

    const dotStarFactory = (
      point: { x: number; y: number },
      pointColor: string,
      strobe: boolean,
      strobeColorArg: string,
    ) => {
      const standardInitialSpeed = shell.spreadSize / 1800;

      if (strobe) {
        const dotSpeed = Math.random() * 0.1 + 0.05;
        const star = Star.add(
          point.x,
          point.y,
          pointColor,
          Math.random() * PI_2,
          dotSpeed,
          shell.starLife +
            Math.random() * shell.starLife * shell.starLifeVariation +
            dotSpeed * 1000,
          shell.horsetail ? shell.comet?.speedX : 0,
          shell.horsetail ? shell.comet?.speedY : -standardInitialSpeed,
          2,
        );

        star.transitionTime = shell.starLife * (Math.random() * 0.08 + 0.46);
        star.strobe = true;
        star.strobeFreq = Math.random() * 20 + 40;
        star.secondColor = strobeColorArg;
      } else {
        Spark.add(
          point.x,
          point.y,
          pointColor,
          Math.random() * PI_2,
          Math.pow(Math.random(), 0.15) * 1.4,
          shell.starLife + Math.random() * shell.starLife * shell.starLifeVariation + 1000,
        );
      }

      Spark.add(
        point.x + 5,
        point.y + 10,
        pointColor,
        Math.random() * PI_2,
        Math.pow(Math.random(), 0.05) * 0.4,
        shell.starLife + Math.random() * shell.starLife * shell.starLifeVariation + 2000,
      );
    };

    if (typeof shell.color === "string") {
      color = shell.color === "random" ? null : shell.color;
      if (shell.ring) {
        const ringStartAngle = Math.random() * Math.PI;
        const ringSquash = Math.pow(Math.random(), 2) * 0.85 + 0.15;
        createParticleArc(0, PI_2, shell.starCount, 0, (angle) => {
          const initialSpeedX = Math.sin(angle) * speed * ringSquash;
          const initialSpeedY = Math.cos(angle) * speed;
          const nextSpeed = MyMath.pointDist(0, 0, initialSpeedX, initialSpeedY);
          const nextAngle = MyMath.pointAngle(0, 0, initialSpeedX, initialSpeedY) + ringStartAngle;
          const star = Star.add(
            x,
            y,
            color || randomColor(),
            nextAngle,
            nextSpeed,
            shell.starLife + Math.random() * shell.starLife * shell.starLifeVariation,
          );

          if (shell.glitter) {
            star.sparkFreq = sparkFreq!;
            star.sparkSpeed = sparkSpeed!;
            star.sparkLife = sparkLife!;
            star.sparkLifeVariation = sparkLifeVariation;
            star.sparkColor = shell.glitterColor;
            star.sparkTimer = Math.random() * star.sparkFreq;
          }
        });
      } else {
        createBurst(shell.starCount, starFactory);
      }
    } else if (Array.isArray(shell.color)) {
      if (Math.random() < 0.5) {
        const start = Math.random() * Math.PI;
        const oppositeStart = start + Math.PI;
        const arc = Math.PI;
        color = shell.color[0];
        createBurst(shell.starCount, starFactory, start, arc);
        color = shell.color[1];
        createBurst(shell.starCount, starFactory, oppositeStart, arc);
      } else {
        color = shell.color[0];
        createBurst(shell.starCount / 2, starFactory);
        color = shell.color[1];
        createBurst(shell.starCount / 2, starFactory);
      }
    } else {
      throw new Error(`无效的烟花颜色配置: ${shell.color as string}`);
    }

    if (
      deps.wordBurstTracker.shouldCreateBurst(
        {
          disableWord: shell.disableWord,
          comet: !!shell.comet,
          forceWordBurst: shell.forceWordBurst,
        },
        currentWordShellEnabled,
      )
    ) {
      const words = fireworksAppConfig.defaultWords;
      const word = words[(Math.random() * words.length) | 0];
      createWordBurst(
        word,
        dotStarFactory,
        x,
        y,
        fireworksAppConfig.wordFontSizeMin,
        fireworksAppConfig.wordFontSizeMax,
        fireworksAppConfig.wordPointDensity,
        fireworksAppConfig.wordFontFamily,
      );
    }

    if (shell.pistil) {
      new Shell({
        spreadSize: shell.spreadSize * 0.5,
        starLife: shell.starLife * 0.6,
        starLifeVariation: shell.starLifeVariation,
        starDensity: 1.4,
        color: shell.pistilColor as string,
        glitter: "light",
        disableWord: true,
        glitterColor:
          typeof shell.pistilColor === "string" && shell.pistilColor === COLOR.Gold
            ? COLOR.Gold
            : COLOR.White,
      }).burst(x, y);
    }

    if (shell.streamers) {
      new Shell({
        spreadSize: shell.spreadSize * 0.9,
        starLife: shell.starLife * 0.8,
        starLifeVariation: shell.starLifeVariation,
        starCount: Math.floor(Math.max(6, shell.spreadSize / 45)),
        color: COLOR.White,
        disableWord: true,
        glitter: "streamer",
      }).burst(x, y);
    }

    BurstFlash.add(x, y, shell.spreadSize / 4);

    if (shell.comet) {
      const maxDiff = 2;
      const sizeDifferenceFromMax = Math.min(
        maxDiff,
        shellSizeSelector(deps.getState()) - shell.shellSize,
      );
      const soundScale = (1 - sizeDifferenceFromMax / maxDiff) * 0.3 + 0.7;
      deps.soundManager.playSound("burst", soundScale);
    }
  }

  // -----------------------------------------------------------------------
  // update (main entry point)
  // -----------------------------------------------------------------------

  function update(frameTime: number, lag: number): void {
    const state = deps.getState();
    if (!isRunning(state)) {
      return;
    }

    // Refresh per-frame state from deps
    currentSimSpeed = deps.getSimSpeed();
    currentSpeedBarOpacity = deps.getSpeedBarOpacity();
    currentQuality = qualitySelector(state);
    currentIsHighQuality = currentQuality === 3;
    Spark.drawWidth = currentIsHighQuality ? 0.75 : 1;
    currentWordShellEnabled = state.config.wordShell;

    // Update effect deps
    effectDeps.currentQuality = currentQuality;
    effectDeps.currentIsHighQuality = currentIsHighQuality;

    const width = deps.trailsStage.width;
    const height = deps.trailsStage.height;
    const timeStep = frameTime * currentSimSpeed;
    const speed = currentSimSpeed * lag;

    currentFrame += 1;

    const starDrag = 1 - (1 - Star.airDrag) * speed;
    const starDragHeavy = 1 - (1 - Star.airDragHeavy) * speed;
    const sparkDrag = 1 - (1 - Spark.airDrag) * speed;
    const gravityAcceleration = (timeStep / 1000) * GRAVITY;

    for (const colorCode of COLOR_CODES_W_INVIS) {
      const stars = Star.active[colorCode];
      for (let index = stars.length - 1; index >= 0; index -= 1) {
        const star = stars[index];
        if (star.updateFrame === currentFrame) {
          continue;
        }

        star.updateFrame = currentFrame;
        star.life -= timeStep;

        if (star.life <= 0) {
          stars.splice(index, 1);
          Star.returnInstance(star);
          continue;
        }

        const burnRate = Math.pow(star.life / star.fullLife, 0.5);
        const inverseBurnRate = 1 - burnRate;

        star.prevX = star.x;
        star.prevY = star.y;
        star.x += star.speedX * speed;
        star.y += star.speedY * speed;

        if (star.heavy) {
          star.speedX *= starDragHeavy;
          star.speedY *= starDragHeavy;
        } else {
          star.speedX *= starDrag;
          star.speedY *= starDrag;
        }

        star.speedY += gravityAcceleration;

        if (star.spinRadius) {
          star.spinAngle += star.spinSpeed * speed;
          star.x += Math.sin(star.spinAngle) * star.spinRadius * speed;
          star.y += Math.cos(star.spinAngle) * star.spinRadius * speed;
        }

        if (star.sparkFreq) {
          star.sparkTimer -= timeStep;
          while (star.sparkTimer < 0) {
            star.sparkTimer += star.sparkFreq * 0.75 + star.sparkFreq * inverseBurnRate * 4;
            Spark.add(
              star.x,
              star.y,
              star.sparkColor,
              Math.random() * PI_2,
              Math.random() * star.sparkSpeed * burnRate,
              star.sparkLife * 0.8 + Math.random() * star.sparkLifeVariation * star.sparkLife,
            );
          }
        }

        if (star.life < star.transitionTime) {
          if (star.secondColor && !star.colorChanged) {
            star.colorChanged = true;
            star.color = star.secondColor;
            stars.splice(index, 1);
            Star.active[star.secondColor].push(star);
            if (star.secondColor === INVISIBLE) {
              star.sparkFreq = 0;
            }
          }

          if (star.strobe) {
            star.visible = Math.floor(star.life / star.strobeFreq!) % 3 === 0;
          }
        }
      }

      const sparks = Spark.active[colorCode];
      for (let index = sparks.length - 1; index >= 0; index -= 1) {
        const spark = sparks[index];
        spark.life -= timeStep;

        if (spark.life <= 0) {
          sparks.splice(index, 1);
          Spark.returnInstance(spark);
          continue;
        }

        spark.prevX = spark.x;
        spark.prevY = spark.y;
        spark.x += spark.speedX * speed;
        spark.y += spark.speedY * speed;
        spark.speedX *= sparkDrag;
        spark.speedY *= sparkDrag;
        spark.speedY += gravityAcceleration;
      }
    }

    render(
      {
        getState: deps.getState,
        trailsStage: deps.trailsStage,
        mainStage: deps.mainStage,
        canvasContainer: deps.canvasContainer,
        currentSpeedBarOpacity,
        currentSimSpeed,
        currentIsHighQuality,
      },
      speed,
      width,
      height,
    );
  }

  return { update, Shell };
}
