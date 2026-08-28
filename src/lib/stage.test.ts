// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createTicker, Stage } from "./stage";
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
  });
});
