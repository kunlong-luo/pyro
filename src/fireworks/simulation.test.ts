// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { createSimulation, type SimulationDeps, type SimulationShellOptions } from "./simulation";
import {
  crysanthemumShell,
  ghostShell,
  strobeShell,
  palmShell,
  ringShell,
  crossetteShell,
  floralShell,
  fallingLeavesShell,
  willowShell,
  crackleShell,
  horsetailShell,
} from "./shells";
import { COLOR, QUALITY_NORMAL } from "./constants";
import { createDefaultState } from "@/stores/fireworksStore";
import { createWordBurstTracker } from "./wordBurst";
import { MyMath } from "@/lib/math";
import type { Runtime, FireworksState } from "@/stores/fireworksStore";
import type { Stage } from "@/lib/stage";
import type { SoundManager } from "./audio";

// ---------------------------------------------------------------------------
// Mocks / fixtures
// ---------------------------------------------------------------------------

/** A canvas 2D context mock recording calls without doing real rendering. */
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

function makeMockStage(
  width = 800,
  height = 600,
): { stage: Stage; ctx: ReturnType<typeof createMockCtx> } {
  const ctx = createMockCtx();
  const stage = { width, height, dpr: 1, ctx } as unknown as Stage;
  return { stage, ctx };
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

function makeState(
  overrides?: Partial<FireworksState> & { configOverrides?: Partial<FireworksState["config"]> },
): FireworksState {
  const base = createDefaultState(runtime);
  return {
    ...base,
    ...overrides,
    config: { ...base.config, ...overrides?.configOverrides },
  };
}

interface Harness {
  deps: SimulationDeps;
  trailsCtx: ReturnType<typeof createMockCtx>;
  mainCtx: ReturnType<typeof createMockCtx>;
  soundManager: SoundManager;
  state: FireworksState;
  setState: (state: FireworksState) => void;
}

function makeHarness(overrides?: Partial<SimulationDeps>): Harness {
  const trails = makeMockStage();
  const main = makeMockStage();
  const soundManager = makeMockSoundManager();
  // createDefaultState() starts paused (matches the real app, which only
  // unpauses after its loading sequence) — default to running for tests.
  let state = makeState({ paused: false });

  const deps: SimulationDeps = {
    getState: () => state,
    getSimSpeed: () => 1,
    getSpeedBarOpacity: () => 0,
    trailsStage: trails.stage,
    mainStage: main.stage,
    soundManager,
    wordBurstTracker: createWordBurstTracker(),
    canvasContainer: document.createElement("div"),
    ...overrides,
  };

  return {
    deps,
    trailsCtx: trails.ctx,
    mainCtx: main.ctx,
    soundManager,
    state,
    setState: (next) => {
      state = next;
    },
  };
}

// ---------------------------------------------------------------------------
// update(): paused / menu-open early exit
// ---------------------------------------------------------------------------

describe("update()", () => {
  it("does nothing when paused", () => {
    const h = makeHarness();
    h.setState(makeState({ paused: true }));
    const sim = createSimulation(h.deps);

    sim.update(17, 1);

    expect(h.trailsCtx.fillRect).not.toHaveBeenCalled();
    expect(h.mainCtx.clearRect).not.toHaveBeenCalled();
  });

  it("does nothing when the menu is open", () => {
    const h = makeHarness();
    h.setState(makeState({ menuOpen: true }));
    const sim = createSimulation(h.deps);

    sim.update(17, 1);

    expect(h.trailsCtx.fillRect).not.toHaveBeenCalled();
  });

  it("renders every frame while running, even with no active particles", () => {
    const h = makeHarness();
    const sim = createSimulation(h.deps);

    sim.update(17, 1);

    expect(h.trailsCtx.fillRect).toHaveBeenCalledTimes(1);
    expect(h.mainCtx.clearRect).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Shell.launch(): comet creation and lifecycle
// ---------------------------------------------------------------------------

describe("Shell.launch()", () => {
  it("plays the lift sound immediately", () => {
    const h = makeHarness();
    const sim = createSimulation(h.deps);
    const shell = new sim.Shell(crysanthemumShell(2, QUALITY_NORMAL) as SimulationShellOptions);

    shell.launch(0.5, 0.5);

    expect(h.soundManager.playSound).toHaveBeenCalledWith("lift");
  });

  it("eventually bursts once the comet's life runs out, and plays the burst sound", () => {
    const h = makeHarness();
    const sim = createSimulation(h.deps);
    const burstSpy = vi.spyOn(sim.Shell.prototype, "burst");
    // Explicit config (not crysanthemumShell's randomized output): pistil
    // and streamers both recursively call burst() on a sub-shell through
    // the same prototype method, which would make this spy's call count
    // non-deterministic depending on Math.random().
    const shell = new sim.Shell({
      spreadSize: 300 + 2 * 100,
      starLife: 900 + 2 * 200,
      color: COLOR.Red,
      pistil: false,
      streamers: false,
    } as SimulationShellOptions);

    shell.launch(0.5, 0.5);
    expect(burstSpy).not.toHaveBeenCalled();

    // Comet life is a few hundred to a couple thousand ms; 400 frames at
    // 20ms each (8000ms of simulated time) is comfortably enough for any
    // launch height in an 800x600 stage.
    for (let i = 0; i < 400 && burstSpy.mock.calls.length === 0; i += 1) {
      sim.update(20, 1);
    }

    expect(burstSpy).toHaveBeenCalledTimes(1);
    expect(h.soundManager.playSound).toHaveBeenCalledWith("burst", expect.any(Number));
  });
});

// ---------------------------------------------------------------------------
// Shell.burst(): color-handling branches
// ---------------------------------------------------------------------------

describe("Shell.burst()", () => {
  it("throws for an invalid color configuration", () => {
    const h = makeHarness();
    const sim = createSimulation(h.deps);
    const shell = new sim.Shell({
      spreadSize: 300,
      starLife: 900,
      color: 42 as unknown as string,
    });

    expect(() => shell.burst(100, 100)).toThrow(/无效的烟花颜色配置/);
  });

  it("handles a single-color burst without throwing", () => {
    const h = makeHarness();
    const sim = createSimulation(h.deps);
    const shell = new sim.Shell({
      spreadSize: 300,
      starLife: 900,
      color: COLOR.Red,
    });
    expect(() => shell.burst(100, 100)).not.toThrow();
  });

  it("handles a two-color array burst (both split-arc and half-count branches)", () => {
    const h = makeHarness();
    const sim = createSimulation(h.deps);

    for (const randomValue of [0.1, 0.9]) {
      const spy = vi.spyOn(Math, "random").mockReturnValue(randomValue);
      try {
        const shell = new sim.Shell({
          spreadSize: 300,
          starLife: 900,
          color: [COLOR.Red, COLOR.Blue],
        });
        expect(() => shell.burst(100, 100)).not.toThrow();
      } finally {
        spy.mockRestore();
      }
    }
  });

  it("handles a ring burst without throwing", () => {
    const h = makeHarness();
    const sim = createSimulation(h.deps);
    const options = ringShell(2, QUALITY_NORMAL) as SimulationShellOptions;
    const shell = new sim.Shell(options);
    expect(() => shell.burst(100, 100)).not.toThrow();
  });

  it("recursively bursts a pistil sub-shell without throwing", () => {
    const h = makeHarness();
    const sim = createSimulation(h.deps);
    const shell = new sim.Shell({
      spreadSize: 300,
      starLife: 900,
      color: COLOR.Red,
      pistil: true,
      pistilColor: COLOR.White,
    });
    expect(() => shell.burst(100, 100)).not.toThrow();
  });

  it("recursively bursts a streamers sub-shell without throwing", () => {
    const h = makeHarness();
    const sim = createSimulation(h.deps);
    const shell = new sim.Shell({
      spreadSize: 300,
      starLife: 900,
      color: COLOR.Red,
      streamers: true,
    });
    expect(() => shell.burst(100, 100)).not.toThrow();
  });

  it("triggers a word burst via literalLattice when the tracker forces one", () => {
    const h = makeHarness({
      wordBurstTracker: {
        shellsSinceLastBurst: 0,
        forceNextBurst: false,
        reset: vi.fn(),
        queueBurst: vi.fn(),
        shouldCreateBurst: () => true,
      },
    });
    const sim = createSimulation(h.deps);
    const latticeSpy = vi
      .spyOn(MyMath, "literalLattice")
      .mockReturnValue({ width: 10, height: 10, points: [{ x: 0, y: 0 }] });

    const shell = new sim.Shell({
      spreadSize: 300,
      starLife: 900,
      color: COLOR.Red,
    });
    shell.burst(100, 100);

    expect(latticeSpy).toHaveBeenCalled();
    latticeSpy.mockRestore();
  });

  it("never triggers a word burst for a comet-less shell, even with the real tracker", () => {
    // shouldCreateBurst's real implementation requires shell.comet to be
    // truthy; burst() called directly (without launch()) never has one, so
    // this must stay false regardless of wordShell/disableWord — and must
    // never reach the (uninstalled-canvas-package) literalLattice call.
    const h = makeHarness({ wordBurstTracker: createWordBurstTracker() });
    h.setState(makeState({ paused: false, configOverrides: { wordShell: true } }));
    const sim = createSimulation(h.deps);
    const latticeSpy = vi.spyOn(MyMath, "literalLattice");

    const shell = new sim.Shell({
      spreadSize: 300,
      starLife: 900,
      color: COLOR.Red,
    });
    shell.burst(100, 100);

    expect(latticeSpy).not.toHaveBeenCalled();
    latticeSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// Full integration: every shell type survives a real launch -> burst -> decay
// lifecycle through the actual physics loop without throwing.
// ---------------------------------------------------------------------------

describe("full shell lifecycle (integration across all 12 shell types)", () => {
  const shellFactories = {
    Crysanthemum: crysanthemumShell,
    Ghost: ghostShell,
    Strobe: strobeShell,
    Palm: palmShell,
    Ring: ringShell,
    Crossette: crossetteShell,
    Floral: floralShell,
    "Falling Leaves": fallingLeavesShell,
    Willow: willowShell,
    Crackle: crackleShell,
    "Horse Tail": horsetailShell,
  };

  it.each(Object.entries(shellFactories))(
    "%s: launches, bursts, and fully decays without throwing",
    (_name, factory) => {
      const h = makeHarness();
      const sim = createSimulation(h.deps);
      const shell = new sim.Shell(factory(2, QUALITY_NORMAL) as SimulationShellOptions);

      expect(() => {
        shell.launch(0.5, 0.5);
        // Long enough for launch, burst, and every spawned star/spark to fully
        // decay (star lives run up to a few seconds; willow's is the longest).
        for (let i = 0; i < 600; i += 1) {
          sim.update(20, 1);
        }
      }).not.toThrow();
    },
  );
});

// ---------------------------------------------------------------------------
// Sky lighting side effect
// ---------------------------------------------------------------------------

describe("sky lighting", () => {
  it("does not touch the container background color when sky lighting is off", () => {
    const h = makeHarness();
    h.setState(makeState({ paused: false, configOverrides: { skyLighting: "0" } }));
    const sim = createSimulation(h.deps);

    sim.update(17, 1);

    expect(h.deps.canvasContainer.style.backgroundColor).toBe("");
  });

  it("sets a background color once particles are active and sky lighting is on", () => {
    const h = makeHarness();
    h.setState(makeState({ paused: false, configOverrides: { skyLighting: "2" } }));
    const sim = createSimulation(h.deps);
    const shell = new sim.Shell(crysanthemumShell(2, QUALITY_NORMAL) as SimulationShellOptions);
    shell.launch(0.5, 0.5);

    sim.update(17, 1);

    expect(h.deps.canvasContainer.style.backgroundColor).toMatch(/^rgb\(/);
  });
});
