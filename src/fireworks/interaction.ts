/*
Copyright © 2022 NianBroken. All rights reserved.
Github: https://github.com/NianBroken/Firework_Simulator
Gitee: https://gitee.com/nianbroken/Firework_Simulator
本项目采用 Apache-2.0 许可证
简而言之，你可以自由使用、修改和分享本项目的代码，但前提是在其衍生作品中必须保留原始许可证和版权信息，并且必须以相同的许可证发布所有修改过的代码。
*/

/**
 * User-interaction handler – TypeScript port of js/fireworks/interaction.js.
 *
 * All mutable per-frame state (simSpeed, currentFrame, speedBarOpacity, …)
 * lives inside the closure created by {@link createInteraction}.  The host
 * application wires external dependencies through {@link InteractionDeps}
 * so the module has no hidden globals.
 */

import type { FireworksState } from "@/stores/fireworksStore";
import type { Stage, PointerEventPayload } from "@/lib/stage";
import type { SoundManager } from "@/fireworks/audio";
import type { LaunchEvent } from "@/fireworks/shells";
import { MAX_WIDTH, MAX_HEIGHT } from "@/fireworks/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** External dependencies required by the interaction module. */
export interface InteractionDeps {
  /** Current application state snapshot. */
  getState: () => FireworksState;
  /** Main canvas stage (used for width/height in hit-testing). */
  mainStage: Stage;
  /** Sound manager (for registerInteraction). */
  soundManager: SoundManager;
  /** Toggle the pause state. */
  togglePause: () => void;
  /** Toggle the sound state. */
  toggleSound: () => void;
  /** Open or close the menu. */
  toggleMenu: (open?: boolean) => void;
  /** Whether the simulation is currently running. */
  isRunning: () => boolean;
  /** Launch a shell at the given event position (or random if null). */
  launchShellFromConfig: (event: LaunchEvent | null) => void;
  /** Start a new auto-launch sequence; returns the delay in ms. */
  startSequence: () => number;
  /** DOM container element whose size drives the stage dimensions. */
  stageContainer: HTMLElement;
  /** All registered Stage instances (for batch resize). */
  stages: Stage[];
  /** Returns the current scale factor from config/state. */
  scaleFactorSelector: () => number;
}

/** Public API returned by {@link createInteraction}. */
export interface Interaction {
  handlePointerStart: (event: PointerEventPayload) => void;
  handlePointerEnd: () => void;
  handlePointerMove: (event: PointerEventPayload) => void;
  handleKeydown: (event: KeyboardEvent) => void;
  handleResize: () => void;
  updateGlobals: (timeStep: number, lag: number) => void;

  /** Current simulation speed (0–1). */
  getSimSpeed: () => number;
  /** Overwrite the simulation speed. */
  setSimSpeed: (v: number) => void;
  /** Current speed-bar opacity (0 = hidden, 1 = fully visible). */
  getSpeedBarOpacity: () => number;
  /** Monotonically increasing frame counter. */
  getCurrentFrame: () => number;
  /** Logical stage width (viewport / scaleFactor). */
  getStageW: () => number;
  /** Logical stage height (viewport / scaleFactor). */
  getStageH: () => number;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createInteraction(deps: InteractionDeps): Interaction {
  // -----------------------------------------------------------------------
  // Closure state (replaces module-level globals)
  // -----------------------------------------------------------------------

  let isUpdatingSpeed = false;
  let currentFrame = 0;
  let speedBarOpacity = 0;
  let autoLaunchTime = 0;
  let simSpeed = 1;
  let stageW = 0;
  let stageH = 0;

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  function registerUserInteraction(): void {
    deps.soundManager.registerInteraction();
  }

  // -----------------------------------------------------------------------
  // Pointer handlers
  // -----------------------------------------------------------------------

  function handlePointerStart(event: PointerEventPayload): void {
    registerUserInteraction();
    const buttonSize = 50;

    if (event.y < buttonSize) {
      if (event.x < buttonSize) {
        deps.togglePause();
        return;
      }

      if (
        event.x > deps.mainStage.width / 2 - buttonSize / 2 &&
        event.x < deps.mainStage.width / 2 + buttonSize / 2
      ) {
        deps.toggleSound();
        return;
      }

      if (event.x > deps.mainStage.width - buttonSize) {
        deps.toggleMenu();
        return;
      }
    }

    if (!deps.isRunning()) {
      return;
    }

    if (updateSpeedFromEvent(event)) {
      isUpdatingSpeed = true;
      return;
    }

    if (event.onCanvas) {
      deps.launchShellFromConfig(event);
    }
  }

  function handlePointerEnd(): void {
    isUpdatingSpeed = false;
  }

  function handlePointerMove(event: PointerEventPayload): void {
    if (!deps.isRunning() || !isUpdatingSpeed) {
      return;
    }

    updateSpeedFromEvent(event);
  }

  // -----------------------------------------------------------------------
  // Keyboard handler
  // -----------------------------------------------------------------------

  function handleKeydown(event: KeyboardEvent): void {
    registerUserInteraction();

    if (event.keyCode === 80) {
      deps.togglePause();
      return;
    }

    if (event.keyCode === 79) {
      deps.toggleMenu();
      return;
    }

    if (event.keyCode === 27) {
      deps.toggleMenu(false);
    }
  }

  // -----------------------------------------------------------------------
  // Resize handler
  // -----------------------------------------------------------------------

  function handleResize(): void {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const containerWidth = Math.min(viewportWidth, MAX_WIDTH);
    const containerHeight =
      viewportWidth <= 420 ? viewportHeight : Math.min(viewportHeight, MAX_HEIGHT);

    deps.stageContainer.style.width = `${containerWidth}px`;
    deps.stageContainer.style.height = `${containerHeight}px`;
    deps.stages.forEach((stage) => stage.resize(containerWidth, containerHeight));

    const scaleFactor = deps.scaleFactorSelector();
    stageW = containerWidth / scaleFactor;
    stageH = containerHeight / scaleFactor;
  }

  // -----------------------------------------------------------------------
  // Speed helpers
  // -----------------------------------------------------------------------

  function updateSpeedFromEvent(event: PointerEventPayload): boolean {
    if (isUpdatingSpeed || event.y >= deps.mainStage.height - 44) {
      const edgePadding = 16;
      const newSpeed = (event.x - edgePadding) / (deps.mainStage.width - edgePadding * 2);
      simSpeed = Math.min(Math.max(newSpeed, 0), 1);
      speedBarOpacity = 1;
      return true;
    }

    return false;
  }

  // -----------------------------------------------------------------------
  // Per-frame global update
  // -----------------------------------------------------------------------

  function updateGlobals(timeStep: number, lag: number): void {
    currentFrame += 1;

    if (!isUpdatingSpeed) {
      speedBarOpacity -= lag / 30;
      if (speedBarOpacity < 0) {
        speedBarOpacity = 0;
      }
    }

    if (deps.getState().config.autoLaunch) {
      autoLaunchTime -= timeStep;
      if (autoLaunchTime <= 0) {
        autoLaunchTime = deps.startSequence() * 1.25;
      }
    }
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  return {
    handlePointerStart,
    handlePointerEnd,
    handlePointerMove,
    handleKeydown,
    handleResize,
    updateGlobals,
    getSimSpeed: () => simSpeed,
    setSimSpeed: (v: number) => {
      simSpeed = v;
    },
    getSpeedBarOpacity: () => speedBarOpacity,
    getCurrentFrame: () => currentFrame,
    getStageW: () => stageW,
    getStageH: () => stageH,
  };
}
