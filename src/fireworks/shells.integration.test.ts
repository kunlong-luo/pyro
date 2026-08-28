// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { createSimulation } from "./simulation";
import type { SimulationDeps } from "./simulation";
import {
  launchShellFromConfig,
  seqRandomShell,
  seqTwoRandom,
  seqTriple,
  seqPyramid,
  seqSmallBarrage,
} from "./shells";
import { QUALITY_NORMAL } from "./constants";
import { createDefaultState } from "@/stores/fireworksStore";
import { createWordBurstTracker } from "./wordBurst";
import type { Runtime, FireworksState } from "@/stores/fireworksStore";
import type { Stage } from "@/lib/stage";
import type { SoundManager } from "./audio";

function createMockCtx() {
  return {
    scale: vi.fn(),
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    setTransform: vi.fn(),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    lineCap: "butt" as CanvasLineCap,
    globalCompositeOperation: "source-over" as GlobalCompositeOperation,
    globalAlpha: 1,
  };
}

function makeMockStage(width = 800, height = 600): Stage {
  const ctx = createMockCtx();
  return { width, height, dpr: 1, ctx } as unknown as Stage;
}

function makeMockSoundManager(): SoundManager {
  return {
    baseURL: "",
    sources: {} as SoundManager["sources"],
    registerInteraction: vi.fn(),
    ensureContext: vi.fn(),
    preload: vi.fn(),
    pauseAll: vi.fn(),
    resumeAll: vi.fn(),
    playSound: vi.fn(),
  };
}

const runtime: Runtime = {
  isDesktop: true,
  isHeader: false,
  isHighEndDevice: true,
  defaultScaleFactor: 1,
  fullscreen: false,
};

function makeState(overrides?: Partial<FireworksState["config"]>): FireworksState {
  const base = createDefaultState(runtime);
  return { ...base, config: { ...base.config, ...overrides } };
}

describe("shells ↔ simulation integration (real Shell, catches signature mismatch)", () => {
  it("launchShellFromConfig with real Shell does not throw (regression for as unknown cast)", () => {
    const trails = makeMockStage();
    const main = makeMockStage();
    const soundManager = makeMockSoundManager();
    const wordBurstTracker = createWordBurstTracker();
    const state = makeState();
    const deps: SimulationDeps = {
      getState: () => state,
      getSimSpeed: () => 1,
      getSpeedBarOpacity: () => 0,
      trailsStage: trails,
      mainStage: main,
      soundManager,
      wordBurstTracker,
      canvasContainer: document.createElement("div"),
    };
    const sim = createSimulation(deps);

    expect(() =>
      launchShellFromConfig(
        { x: 100, y: 100 },
        {
          quality: QUALITY_NORMAL,
          isHeader: false,
          isDesktop: true,
          state,
          shellCtor: sim.Shell,
          stageWidth: 800,
          stageHeight: 600,
          registerUserInteraction: vi.fn(),
          wordBurstTracker,
        },
      ),
    ).not.toThrow();
  });

  it("launchShellFromConfig with null event (random position) does not throw", () => {
    const trails = makeMockStage();
    const main = makeMockStage();
    const soundManager = makeMockSoundManager();
    const wordBurstTracker = createWordBurstTracker();
    const state = makeState();
    const deps: SimulationDeps = {
      getState: () => state,
      getSimSpeed: () => 1,
      getSpeedBarOpacity: () => 0,
      trailsStage: trails,
      mainStage: main,
      soundManager,
      wordBurstTracker,
      canvasContainer: document.createElement("div"),
    };
    const sim = createSimulation(deps);

    expect(() =>
      launchShellFromConfig(null, {
        quality: QUALITY_NORMAL,
        isHeader: false,
        isDesktop: true,
        state,
        shellCtor: sim.Shell,
        stageWidth: 800,
        stageHeight: 600,
        registerUserInteraction: vi.fn(),
        wordBurstTracker,
      }),
    ).not.toThrow();
  });

  it.each([
    ["seqRandomShell", seqRandomShell],
    ["seqTwoRandom", seqTwoRandom],
    ["seqTriple", seqTriple],
    ["seqPyramid", seqPyramid],
    ["seqSmallBarrage", seqSmallBarrage],
  ] as const)("%s with real Shell does not throw", (_name, fn) => {
    const trails = makeMockStage();
    const main = makeMockStage();
    const soundManager = makeMockSoundManager();
    const wordBurstTracker = createWordBurstTracker();
    const state = makeState();
    const deps: SimulationDeps = {
      getState: () => state,
      getSimSpeed: () => 1,
      getSpeedBarOpacity: () => 0,
      trailsStage: trails,
      mainStage: main,
      soundManager,
      wordBurstTracker,
      canvasContainer: document.createElement("div"),
    };
    const sim = createSimulation(deps);

    expect(() =>
      fn({
        quality: QUALITY_NORMAL,
        isHeader: false,
        isDesktop: true,
        state,
        shellCtor: sim.Shell,
        stageWidth: 800,
        stageHeight: 600,
        registerUserInteraction: vi.fn(),
        wordBurstTracker,
      }),
    ).not.toThrow();
  });

  it("startSequence with real Shell does not throw and returns a delay", async () => {
    vi.resetModules();
    const fresh = await import("./shells");
    const trails = makeMockStage();
    const main = makeMockStage();
    const soundManager = makeMockSoundManager();
    const wordBurstTracker = createWordBurstTracker();
    const state = makeState({ finale: false });
    const deps: SimulationDeps = {
      getState: () => state,
      getSimSpeed: () => 1,
      getSpeedBarOpacity: () => 0,
      trailsStage: trails,
      mainStage: main,
      soundManager,
      wordBurstTracker,
      canvasContainer: document.createElement("div"),
    };
    const sim = createSimulation(deps);
    // Burn first-call branch once so we're testing the steady path
    fresh.startSequence({
      quality: QUALITY_NORMAL,
      isHeader: false,
      isDesktop: true,
      state,
      shellCtor: sim.Shell,
      stageWidth: 800,
      stageHeight: 600,
      registerUserInteraction: vi.fn(),
      wordBurstTracker,
    });
    const delay = fresh.startSequence({
      quality: QUALITY_NORMAL,
      isHeader: false,
      isDesktop: true,
      state,
      shellCtor: sim.Shell,
      stageWidth: 800,
      stageHeight: 600,
      registerUserInteraction: vi.fn(),
      wordBurstTracker,
    });
    expect(typeof delay).toBe("number");
    expect(delay).toBeGreaterThan(0);
  });
});
