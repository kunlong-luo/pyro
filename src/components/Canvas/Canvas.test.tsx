// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup, act } from "@testing-library/react";
import { Canvas } from "./Canvas";
import { Stage } from "@/lib/stage";
import type { Ticker } from "@/lib/stage";

function stubCanvasContext(): void {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    () => ({}) as unknown as CanvasRenderingContext2D,
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Canvas", () => {
  it("creates a trails Stage and a main Stage on mount and reports them via onTickerReady", () => {
    stubCanvasContext();
    const onTickerReady = vi.fn();

    render(<Canvas stageW={800} stageH={600} scaleFactor={1} onTickerReady={onTickerReady} />);

    expect(onTickerReady).toHaveBeenCalledTimes(1);
    const [ticker, trailsStage, mainStage] = onTickerReady.mock.calls[0] as [Ticker, Stage, Stage];
    expect(ticker.addListener).toBeInstanceOf(Function);
    expect(trailsStage).toBeInstanceOf(Stage);
    expect(mainStage).toBeInstanceOf(Stage);
    expect(trailsStage).not.toBe(mainStage);
    expect(trailsStage.canvas.id).toBe("trails-canvas");
    expect(mainStage.canvas.id).toBe("main-canvas");
  });

  it("resizes both stages when stageW/stageH props change", () => {
    stubCanvasContext();
    const onTickerReady = vi.fn();
    const onResize = vi.fn();

    const { rerender } = render(
      <Canvas
        stageW={800}
        stageH={600}
        scaleFactor={1}
        onTickerReady={onTickerReady}
        onResize={onResize}
      />,
    );
    const [, trailsStage, mainStage] = onTickerReady.mock.calls[0] as [Ticker, Stage, Stage];
    onResize.mockClear();

    rerender(
      <Canvas
        stageW={1024}
        stageH={768}
        scaleFactor={1}
        onTickerReady={onTickerReady}
        onResize={onResize}
      />,
    );

    expect(trailsStage.width).toBe(1024);
    expect(trailsStage.height).toBe(768);
    expect(mainStage.width).toBe(1024);
    expect(mainStage.height).toBe(768);
    expect(onResize).toHaveBeenCalledWith(1024, 768);
  });

  it("routes a stage pointerstart event to the onPointerStart prop", () => {
    stubCanvasContext();
    const onTickerReady = vi.fn();
    const onPointerStart = vi.fn();

    render(
      <Canvas
        stageW={800}
        stageH={600}
        scaleFactor={1}
        onTickerReady={onTickerReady}
        onPointerStart={onPointerStart}
      />,
    );
    const [, trailsStage] = onTickerReady.mock.calls[0] as [Ticker, Stage, Stage];

    act(() => {
      trailsStage.pointerEvent("start", 10, 20);
    });

    expect(onPointerStart).toHaveBeenCalledWith(
      expect.objectContaining({ type: "start", x: 10, y: 20 }),
    );
  });

  it("routes pointermove and pointerend events to their respective props", () => {
    stubCanvasContext();
    const onTickerReady = vi.fn();
    const onPointerMove = vi.fn();
    const onPointerEnd = vi.fn();

    render(
      <Canvas
        stageW={800}
        stageH={600}
        scaleFactor={1}
        onTickerReady={onTickerReady}
        onPointerMove={onPointerMove}
        onPointerEnd={onPointerEnd}
      />,
    );
    const [, , mainStage] = onTickerReady.mock.calls[0] as [Ticker, Stage, Stage];

    act(() => {
      mainStage.pointerEvent("move", 5, 6);
      mainStage.pointerEvent("end", 7, 8);
    });

    expect(onPointerMove).toHaveBeenCalledWith(expect.objectContaining({ x: 5, y: 6 }));
    expect(onPointerEnd).toHaveBeenCalledWith(expect.objectContaining({ x: 7, y: 8 }));
  });

  it("does not directly handle window resize — parent drives resize via props (de-duplicated)", () => {
    stubCanvasContext();
    const onTickerReady = vi.fn();
    const onResize = vi.fn();

    render(
      <Canvas
        stageW={800}
        stageH={600}
        scaleFactor={1}
        onTickerReady={onTickerReady}
        onResize={onResize}
      />,
    );
    const [, trailsStage, mainStage] = onTickerReady.mock.calls[0] as [Ticker, Stage, Stage];
    onResize.mockClear();
    const trailsResizeSpy = vi.spyOn(trailsStage, "resize");
    const mainResizeSpy = vi.spyOn(mainStage, "resize");

    act(() => {
      window.dispatchEvent(new Event("resize"));
    });

    // Parent (useSimulator) is now the single window-resize owner and
    // drives Canvas via stageW/stageH props; Canvas no longer has its
    // own window listener, so a raw window event must not trigger a resize.
    expect(trailsResizeSpy).not.toHaveBeenCalled();
    expect(mainResizeSpy).not.toHaveBeenCalled();
    expect(onResize).not.toHaveBeenCalled();
  });

  it("destroys both stages on unmount", () => {
    stubCanvasContext();
    const onTickerReady = vi.fn();

    const { unmount } = render(
      <Canvas stageW={800} stageH={600} scaleFactor={1} onTickerReady={onTickerReady} />,
    );
    const [, trailsStage, mainStage] = onTickerReady.mock.calls[0] as [Ticker, Stage, Stage];
    const trailsDestroySpy = vi.spyOn(trailsStage, "destroy");
    const mainDestroySpy = vi.spyOn(mainStage, "destroy");

    unmount();

    expect(trailsDestroySpy).toHaveBeenCalledTimes(1);
    expect(mainDestroySpy).toHaveBeenCalledTimes(1);
  });

  it("mounts without crashing when no callback props are provided", () => {
    stubCanvasContext();

    render(<Canvas stageW={400} stageH={300} scaleFactor={1} />);

    expect(document.getElementById("trails-canvas")).not.toBeNull();
    expect(document.getElementById("main-canvas")).not.toBeNull();
  });
});
