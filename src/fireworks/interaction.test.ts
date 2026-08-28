// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createInteraction, type InteractionDeps, type Interaction } from "./interaction";
import type { PointerEventPayload } from "@/lib/stage";
import type { Stage } from "@/lib/stage";
import { createDefaultState } from "@/stores/fireworksStore";
import type { Runtime, FireworksState } from "@/stores/fireworksStore";

const runtime: Runtime = {
  isDesktop: true,
  isHeader: false,
  isHighEndDevice: true,
  defaultScaleFactor: 1,
  fullscreen: false,
};

function makePointer(overrides: Partial<PointerEventPayload> = {}): PointerEventPayload {
  return { type: "start", x: 100, y: 100, onCanvas: true, ...overrides };
}

interface Harness {
  deps: InteractionDeps;
  interaction: Interaction;
  state: FireworksState;
}

function makeHarness(overrides?: Partial<InteractionDeps>): Harness {
  const state = createDefaultState(runtime);
  const deps: InteractionDeps = {
    getState: () => state,
    mainStage: { width: 800, height: 600 } as unknown as Stage,
    soundManager: { registerInteraction: vi.fn() } as unknown as InteractionDeps["soundManager"],
    togglePause: vi.fn(),
    toggleSound: vi.fn(),
    toggleMenu: vi.fn(),
    isRunning: vi.fn(() => true),
    launchShellFromConfig: vi.fn(),
    startSequence: vi.fn(() => 1000),
    stageContainer: document.createElement("div"),
    stages: [],
    scaleFactorSelector: () => 1,
    ...overrides,
  };
  return { deps, interaction: createInteraction(deps), state };
}

describe("handlePointerStart", () => {
  it("toggles pause when clicking the top-left button region", () => {
    const h = makeHarness();
    h.interaction.handlePointerStart(makePointer({ x: 10, y: 10 }));
    expect(h.deps.togglePause).toHaveBeenCalledTimes(1);
    expect(h.deps.launchShellFromConfig).not.toHaveBeenCalled();
  });

  it("toggles sound when clicking the top-center button region", () => {
    const h = makeHarness();
    h.interaction.handlePointerStart(makePointer({ x: 400, y: 10 }));
    expect(h.deps.toggleSound).toHaveBeenCalledTimes(1);
  });

  it("toggles the menu when clicking the top-right button region", () => {
    const h = makeHarness();
    h.interaction.handlePointerStart(makePointer({ x: 790, y: 10 }));
    expect(h.deps.toggleMenu).toHaveBeenCalledTimes(1);
    expect(h.deps.toggleMenu).toHaveBeenCalledWith();
  });

  it("registers user interaction on every pointer start", () => {
    const h = makeHarness();
    h.interaction.handlePointerStart(makePointer());
    expect(h.deps.soundManager.registerInteraction).toHaveBeenCalledTimes(1);
  });

  it("does nothing further when not running (outside the button row)", () => {
    const h = makeHarness({ isRunning: () => false });
    h.interaction.handlePointerStart(makePointer({ x: 400, y: 300 }));
    expect(h.deps.launchShellFromConfig).not.toHaveBeenCalled();
  });

  it("launches a shell when clicking on the canvas while running", () => {
    const h = makeHarness();
    const event = makePointer({ x: 400, y: 300, onCanvas: true });
    h.interaction.handlePointerStart(event);
    expect(h.deps.launchShellFromConfig).toHaveBeenCalledWith(event);
  });

  it("does not launch a shell when the pointer is off-canvas", () => {
    const h = makeHarness();
    h.interaction.handlePointerStart(makePointer({ x: 400, y: 300, onCanvas: false }));
    expect(h.deps.launchShellFromConfig).not.toHaveBeenCalled();
  });

  it("treats a press near the bottom edge as a speed-bar drag, not a launch", () => {
    const h = makeHarness();
    h.interaction.handlePointerStart(makePointer({ x: 400, y: 590, onCanvas: true }));
    expect(h.deps.launchShellFromConfig).not.toHaveBeenCalled();
    expect(h.interaction.getSpeedBarOpacity()).toBe(1);
  });
});

describe("handlePointerEnd / handlePointerMove", () => {
  it("stops an in-progress speed drag on pointer end, so a later move is ignored", () => {
    const h = makeHarness();
    h.interaction.handlePointerStart(makePointer({ x: 400, y: 590 })); // starts a speed drag
    h.interaction.handlePointerEnd();
    h.interaction.setSimSpeed(0.42);

    h.interaction.handlePointerMove(makePointer({ x: 0, y: 300 }));
    expect(h.interaction.getSimSpeed()).toBe(0.42); // unchanged
  });

  it("updates simSpeed while dragging, clamped to [0,1]", () => {
    const h = makeHarness();
    h.interaction.handlePointerStart(makePointer({ x: 400, y: 590 })); // starts drag, mid speed

    h.interaction.handlePointerMove(makePointer({ x: -1000, y: 590 }));
    expect(h.interaction.getSimSpeed()).toBe(0);

    h.interaction.handlePointerMove(makePointer({ x: 100000, y: 590 }));
    expect(h.interaction.getSimSpeed()).toBe(1);
  });

  it("ignores pointer moves when not running", () => {
    const h = makeHarness({ isRunning: () => false });
    h.interaction.handlePointerMove(makePointer({ x: 0, y: 590 }));
    expect(h.interaction.getSimSpeed()).toBe(1); // unchanged default
  });
});

describe("handleKeydown", () => {
  it("toggles pause on 'p' (keyCode 80)", () => {
    const h = makeHarness();
    h.interaction.handleKeydown({ keyCode: 80 } as KeyboardEvent);
    expect(h.deps.togglePause).toHaveBeenCalledTimes(1);
  });

  it("toggles the menu open on 'o' (keyCode 79)", () => {
    const h = makeHarness();
    h.interaction.handleKeydown({ keyCode: 79 } as KeyboardEvent);
    expect(h.deps.toggleMenu).toHaveBeenCalledWith();
  });

  it("closes the menu on Escape (keyCode 27)", () => {
    const h = makeHarness();
    h.interaction.handleKeydown({ keyCode: 27 } as KeyboardEvent);
    expect(h.deps.toggleMenu).toHaveBeenCalledWith(false);
  });

  it("registers user interaction for every keydown", () => {
    const h = makeHarness();
    h.interaction.handleKeydown({ keyCode: 65 } as KeyboardEvent);
    expect(h.deps.soundManager.registerInteraction).toHaveBeenCalledTimes(1);
  });
});

describe("handleResize", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", { value: 1000, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: 700, configurable: true });
  });

  it("sizes the stage container from the viewport and resizes every stage", () => {
    const resizeSpy = vi.fn();
    const stage = { resize: resizeSpy } as unknown as Stage;
    const h = makeHarness({ stages: [stage] });

    h.interaction.handleResize();

    expect(h.deps.stageContainer.style.width).toBe("1000px");
    expect(h.deps.stageContainer.style.height).toBe("700px");
    expect(resizeSpy).toHaveBeenCalledWith(1000, 700);
  });

  it("divides logical stage size by the scale factor", () => {
    const h = makeHarness({ scaleFactorSelector: () => 2 });
    h.interaction.handleResize();
    expect(h.interaction.getStageW()).toBe(500);
    expect(h.interaction.getStageH()).toBe(350);
  });
});

describe("updateGlobals", () => {
  it("decays the speed-bar opacity over time when not actively dragging", () => {
    const h = makeHarness();
    h.interaction.handlePointerStart(makePointer({ x: 400, y: 590 })); // opacity -> 1
    h.interaction.handlePointerEnd();

    h.interaction.updateGlobals(16, 15); // lag=15 -> opacity -= 0.5
    expect(h.interaction.getSpeedBarOpacity()).toBeCloseTo(0.5);
  });

  it("never lets speed-bar opacity go negative", () => {
    const h = makeHarness();
    h.interaction.handlePointerStart(makePointer({ x: 400, y: 590 }));
    h.interaction.handlePointerEnd();

    h.interaction.updateGlobals(16, 1000);
    expect(h.interaction.getSpeedBarOpacity()).toBe(0);
  });

  it("starts a new auto-launch sequence once the timer runs out", () => {
    const h = makeHarness();
    h.state.config.autoLaunch = true;

    h.interaction.updateGlobals(1, 1); // autoLaunchTime starts at 0 -> fires immediately
    expect(h.deps.startSequence).toHaveBeenCalledTimes(1);
  });

  it("does not auto-launch when autoLaunch is off", () => {
    const h = makeHarness();
    h.state.config.autoLaunch = false;
    h.interaction.updateGlobals(1000, 1);
    expect(h.deps.startSequence).not.toHaveBeenCalled();
  });
});
