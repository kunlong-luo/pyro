// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createTicker, Stage, initGlobalHandlers, cleanupGlobalHandlers } from "./stage";
import type { PointerEventPayload } from "./stage";

function stubCanvasContext(): void {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    () => ({}) as unknown as CanvasRenderingContext2D,
  );
}

function stubRaf(): { fire: (timestamp: number) => void; calls: number } {
  const state: { fire: (timestamp: number) => void; calls: number } = {
    fire: (timestamp) => {
      throw new Error(`no requestAnimationFrame callback registered yet (timestamp ${timestamp})`);
    },
    calls: 0,
  };
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    state.calls += 1;
    state.fire = (timestamp: number) => cb(timestamp);
    return 0;
  });
  return state;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// Ticker
// ---------------------------------------------------------------------------

describe("createTicker", () => {
  it("throws when adding a non-function listener", () => {
    const ticker = createTicker();
    expect(() => ticker.addListener(null as unknown as () => void)).toThrow();
  });

  it("only starts the animation frame loop once, even with multiple listeners", () => {
    const raf = stubRaf();
    const ticker = createTicker();
    ticker.addListener(() => {});
    ticker.addListener(() => {});
    expect(raf.calls).toBe(1);
  });

  it("invokes every listener with clamped frameTime and derived lag", () => {
    const raf = stubRaf();
    const ticker = createTicker();
    const listener = vi.fn();
    ticker.addListener(listener);

    raf.fire(20); // lastTimestamp starts at 0 -> frameTime = 20 (within [17,68])
    expect(listener).toHaveBeenCalledWith(20, 20 / 16.6667);

    raf.fire(1020); // next delta = 1000 -> clamped to 68 (max)
    expect(listener).toHaveBeenLastCalledWith(68, 68 / 16.6667);
  });

  it("clamps a negative frameTime (clock skew) to 17", () => {
    const raf = stubRaf();
    const ticker = createTicker();
    const listener = vi.fn();
    ticker.addListener(listener);

    raf.fire(100);
    raf.fire(50); // timestamp went backwards -> frameTime negative
    expect(listener).toHaveBeenLastCalledWith(17, 17 / 16.6667);
  });
});

// ---------------------------------------------------------------------------
// Stage
// ---------------------------------------------------------------------------

describe("Stage", () => {
  beforeEach(() => {
    Stage.disableHighDPI = true; // keep dpr=1 predictable across test environments
  });

  it("throws when the canvas has no 2D context available", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const canvas = document.createElement("canvas");
    expect(() => new Stage(canvas)).toThrow(/2D 画布/);
  });

  it("throws for a string id that does not resolve to a canvas element", () => {
    stubCanvasContext();
    expect(() => new Stage("does-not-exist")).toThrow(/未找到目标画布节点/);
  });

  it("accepts a canvas element directly and derives width/height from it", () => {
    stubCanvasContext();
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 300;
    const stage = new Stage(canvas);

    expect(stage.width).toBe(400);
    expect(stage.height).toBe(300);
    expect(stage.dpr).toBe(1);
  });

  it("resize() updates dimensions, canvas size, and fires resize listeners", () => {
    stubCanvasContext();
    const stage = new Stage(document.createElement("canvas"));
    const onResize = vi.fn();
    stage.addEventListener("resize", onResize);

    stage.resize(640, 480);

    expect(stage.width).toBe(640);
    expect(stage.height).toBe(480);
    expect(stage.canvas.width).toBe(640);
    expect(stage.canvas.height).toBe(480);
    expect(stage.canvas.style.width).toBe("640px");
    expect(onResize).toHaveBeenCalledTimes(1);
  });

  it("dispatches pointer events with onCanvas computed from the event coordinates", () => {
    stubCanvasContext();
    const stage = new Stage(document.createElement("canvas"));
    stage.resize(800, 600);
    const payloads: PointerEventPayload[] = [];
    stage.addEventListener("pointerstart", (payload) => {
      if (payload) payloads.push(payload);
    });

    stage.pointerEvent("start", 400, 300);
    stage.pointerEvent("start", -10, 300);

    expect(payloads[0]).toEqual({ type: "start", x: 400, y: 300, onCanvas: true });
    expect(payloads[1].onCanvas).toBe(false);
  });

  it("delegates a 'ticker' addEventListener call to the given Ticker instance", () => {
    stubCanvasContext();
    const stage = new Stage(document.createElement("canvas"));
    const ticker = createTicker();
    const addListenerSpy = vi.spyOn(ticker, "addListener");
    const handler = vi.fn();

    stage.addEventListener("ticker", handler, ticker);

    expect(addListenerSpy).toHaveBeenCalledWith(handler);
  });

  it("throws when dispatching or listening on an unknown event type", () => {
    stubCanvasContext();
    const stage = new Stage(document.createElement("canvas"));
    expect(() => stage.addEventListener("bogus" as never, () => {})).toThrow(/无效事件类型/);
    expect(() => stage.dispatchEvent("bogus" as never, {} as never)).toThrow(/无效事件类型/);
  });

  it("destroy() removes the stage from the module registry", () => {
    initGlobalHandlers();
    stubCanvasContext();
    const stage = new Stage(document.createElement("canvas"));
    stage.resize(800, 600);
    vi.spyOn(stage.canvas, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 800,
      height: 600,
      right: 800,
      bottom: 600,
      x: 0,
      y: 0,
      toJSON() {},
    } as DOMRect);
    const onPointerStart = vi.fn();
    stage.addEventListener("pointerstart", onPointerStart);

    document.dispatchEvent(new MouseEvent("mousedown", { clientX: 100, clientY: 100 }));
    expect(onPointerStart).toHaveBeenCalledTimes(1);

    stage.destroy();
    onPointerStart.mockClear();
    document.dispatchEvent(new MouseEvent("mousedown", { clientX: 100, clientY: 100 }));
    expect(onPointerStart).not.toHaveBeenCalled();
    cleanupGlobalHandlers();
  });

  it("scales the canvas backing store up when the device pixel ratio is above 1", () => {
    Stage.disableHighDPI = false;
    vi.stubGlobal("devicePixelRatio", 2);
    stubCanvasContext();
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 300;

    const stage = new Stage(canvas);

    expect(stage.dpr).toBe(2);
    expect(stage.naturalWidth).toBe(800);
    expect(stage.naturalHeight).toBe(600);
    expect(canvas.width).toBe(800);
    expect(canvas.height).toBe(600);
    expect(canvas.style.width).toBe("400px");
    expect(canvas.style.height).toBe("300px");
    stage.destroy();
  });

  it("divides out a reported backingStorePixelRatio when computing dpr", () => {
    Stage.disableHighDPI = false;
    vi.stubGlobal("devicePixelRatio", 2);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
      () => ({ backingStorePixelRatio: 2 }) as unknown as CanvasRenderingContext2D,
    );
    const stage = new Stage(document.createElement("canvas"));

    expect(stage.dpr).toBe(1); // devicePixelRatio(2) / backingStorePixelRatio(2)
    stage.destroy();
  });
});

describe("Stage.windowToCanvas", () => {
  it("maps a window-space point to canvas-space, accounting for CSS scaling", () => {
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;
    vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
      left: 10,
      top: 20,
      width: 400, // CSS size is half the backing-store size
      height: 300,
      right: 410,
      bottom: 320,
      x: 10,
      y: 20,
      toJSON() {},
    } as DOMRect);

    expect(Stage.windowToCanvas(canvas, 110, 170)).toEqual({ x: 200, y: 300 });
  });
});

describe("global mouse/touch DOM handlers", () => {
  function makePositionedStage(): Stage {
    stubCanvasContext();
    Stage.disableHighDPI = true;
    const stage = new Stage(document.createElement("canvas"));
    stage.resize(800, 600);
    vi.spyOn(stage.canvas, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 800,
      height: 600,
      right: 800,
      bottom: 600,
      x: 0,
      y: 0,
      toJSON() {},
    } as DOMRect);
    return stage;
  }

  beforeEach(() => {
    initGlobalHandlers();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanupGlobalHandlers();
  });

  it("routes a mousedown/mousemove/mouseup sequence to the matching stage pointer events", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);
    const stage = makePositionedStage();
    const events: string[] = [];
    stage.addEventListener("pointerstart", (p) => events.push(`start:${p!.x},${p!.y}`));
    stage.addEventListener("pointermove", (p) => events.push(`move:${p!.x},${p!.y}`));
    stage.addEventListener("pointerend", (p) => events.push(`end:${p!.x},${p!.y}`));

    document.dispatchEvent(new MouseEvent("mousedown", { clientX: 100, clientY: 150 }));
    document.dispatchEvent(new MouseEvent("mousemove", { clientX: 110, clientY: 160 }));
    document.dispatchEvent(new MouseEvent("mouseup", { clientX: 110, clientY: 160 }));

    expect(events).toEqual(["start:100,150", "move:110,160", "end:110,160"]);
    stage.destroy();
  });

  it("suppresses mouse events fired within 500ms of the last touch event", () => {
    vi.useFakeTimers();
    vi.setSystemTime(2_000_000);
    const stage = makePositionedStage();
    const onStart = vi.fn();
    stage.addEventListener("pointerstart", onStart);
    stage.addEventListener("pointermove", onStart);

    document.dispatchEvent(
      new TouchEvent("touchstart", {
        changedTouches: [{ clientX: 50, clientY: 50 } as unknown as Touch],
      }),
    );
    onStart.mockClear();

    vi.setSystemTime(2_000_400); // 400ms later — still inside the 500ms window
    document.dispatchEvent(new MouseEvent("mousedown", { clientX: 100, clientY: 100 }));
    expect(onStart).not.toHaveBeenCalled();

    vi.setSystemTime(2_000_600); // 600ms after the touch — window has elapsed
    document.dispatchEvent(new MouseEvent("mousedown", { clientX: 100, clientY: 100 }));
    expect(onStart).toHaveBeenCalledTimes(1);
    stage.destroy();
  });

  it("touchstart fires a synthetic pointermove (for hover state) followed by pointerstart", () => {
    vi.useFakeTimers();
    vi.setSystemTime(3_000_000);
    const stage = makePositionedStage();
    const events: string[] = [];
    stage.addEventListener("pointermove", (p) => events.push(`move:${p!.x},${p!.y}`));
    stage.addEventListener("pointerstart", (p) => events.push(`start:${p!.x},${p!.y}`));

    document.dispatchEvent(
      new TouchEvent("touchstart", {
        changedTouches: [{ clientX: 200, clientY: 250 } as unknown as Touch],
      }),
    );

    expect(events).toEqual(["move:200,250", "start:200,250"]);
    stage.destroy();
  });

  it("touchmove fires only pointermove; touchend replays the last known touch position", () => {
    vi.useFakeTimers();
    vi.setSystemTime(4_000_000);
    const stage = makePositionedStage();
    const events: string[] = [];
    stage.addEventListener("pointermove", (p) => events.push(`move:${p!.x},${p!.y}`));
    stage.addEventListener("pointerend", (p) => events.push(`end:${p!.x},${p!.y}`));

    document.dispatchEvent(
      new TouchEvent("touchstart", {
        changedTouches: [{ clientX: 10, clientY: 10 } as unknown as Touch],
      }),
    );
    events.length = 0;

    document.dispatchEvent(
      new TouchEvent("touchmove", {
        changedTouches: [{ clientX: 30, clientY: 40 } as unknown as Touch],
      }),
    );
    expect(events).toEqual(["move:30,40"]);

    events.length = 0;
    // touchend carries no useful clientX/clientY of its own — the handler
    // replays lastPointerPos captured on the most recent start/move instead.
    document.dispatchEvent(
      new TouchEvent("touchend", {
        changedTouches: [{ clientX: 0, clientY: 0 } as unknown as Touch],
      }),
    );
    expect(events).toEqual(["end:30,40"]);
    stage.destroy();
  });
});
