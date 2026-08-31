/*
Copyright © 2022 NianBroken. All rights reserved.
Github: https://github.com/NianBroken/Firework_Simulator
Gitee: https://gitee.com/nianbroken/Firework_Simulator
Licensed under Apache-2.0. You are free to use, modify, and distribute this code,
provided that you retain the original license and copyright notice in derivative works
and publish any modifications under the same license.
*/

// ---------------------------------------------------------------------------
// Ticker
// ---------------------------------------------------------------------------

export type FrameCallback = (frameTime: number, lag: number) => void;

export interface Ticker {
  addListener(callback: FrameCallback): void;
}

export function createTicker(): Ticker {
  let started = false;
  let lastTimestamp = 0;
  const listeners: FrameCallback[] = [];

  function queueFrame(): void {
    if (window.requestAnimationFrame) {
      window.requestAnimationFrame(handleFrame);
      return;
    }

    (
      window as unknown as { webkitRequestAnimationFrame: (cb: FrameRequestCallback) => void }
    ).webkitRequestAnimationFrame(handleFrame);
  }

  function handleFrame(timestamp: DOMHighResTimeStamp): void {
    let frameTime = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    if (frameTime < 0) {
      frameTime = 17;
    } else if (frameTime > 68) {
      frameTime = 68;
    }

    const lag = frameTime / 16.6667;
    for (const listener of listeners) {
      listener(frameTime, lag);
    }

    queueFrame();
  }

  return {
    addListener(callback: FrameCallback): void {
      if (typeof callback !== "function") {
        throw new Error("Ticker.addListener() requires a function argument.");
      }

      listeners.push(callback);
      if (!started) {
        started = true;
        queueFrame();
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Stage helpers & types
// ---------------------------------------------------------------------------

export type StageEventName = "resize" | "pointerstart" | "pointermove" | "pointerend";

export interface PointerEventPayload {
  type: "start" | "move" | "end";
  x: number;
  y: number;
  onCanvas: boolean;
}

export type StageEventHandler = (payload?: PointerEventPayload) => void;

interface CanvasContextWithBackingStore extends CanvasRenderingContext2D {
  backingStorePixelRatio?: number;
}

function getDevicePixelRatio(context: CanvasRenderingContext2D, disableHighDPI: boolean): number {
  if (disableHighDPI) {
    return 1;
  }

  const backingStoreRatio = (context as CanvasContextWithBackingStore).backingStorePixelRatio ?? 1;
  return (window.devicePixelRatio ?? 1) / backingStoreRatio;
}

function ensureCanvasNode(canvas: string | HTMLCanvasElement): HTMLCanvasElement {
  if (typeof canvas === "string") {
    const el = document.getElementById(canvas);
    if (!(el instanceof HTMLCanvasElement)) {
      throw new Error("Missing target canvas node.");
    }
    return el;
  }
  return canvas;
}

// ---------------------------------------------------------------------------
// Stage registry (replaces global Stage.stages array)
// ---------------------------------------------------------------------------

const stages = new Set<Stage>();

// ---------------------------------------------------------------------------
// Stage
// ---------------------------------------------------------------------------

export class Stage {
  static disableHighDPI = false;

  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  readonly dpr: number;

  width: number;
  height: number;
  naturalWidth: number;
  naturalHeight: number;
  speed: number;

  readonly _listeners: {
    resize: StageEventHandler[];
    pointerstart: StageEventHandler[];
    pointermove: StageEventHandler[];
    pointerend: StageEventHandler[];
    lastPointerPos: { x: number; y: number };
  };

  constructor(canvas: string | HTMLCanvasElement) {
    this.canvas = ensureCanvasNode(canvas);

    const ctx = this.canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Current environment does not support 2D canvas.");
    }
    this.ctx = ctx;

    this.speed = 1;
    this.canvas.style.touchAction = "none";
    this.dpr = getDevicePixelRatio(this.ctx, Stage.disableHighDPI);
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.naturalWidth = this.width * this.dpr;
    this.naturalHeight = this.height * this.dpr;

    this._listeners = {
      resize: [],
      pointerstart: [],
      pointermove: [],
      pointerend: [],
      lastPointerPos: { x: 0, y: 0 },
    };

    if (this.width !== this.naturalWidth) {
      this.canvas.width = this.naturalWidth;
      this.canvas.height = this.naturalHeight;
      this.canvas.style.width = `${this.width}px`;
      this.canvas.style.height = `${this.height}px`;
    }

    stages.add(this);
  }

  // -- event system ----------------------------------------------------------

  addEventListener(event: "ticker", handler: FrameCallback, ticker: Ticker): void;
  addEventListener(event: StageEventName, handler: StageEventHandler): void;
  addEventListener(
    event: StageEventName | "ticker",
    handler: StageEventHandler | FrameCallback,
    ticker?: Ticker,
  ): void {
    if (event === "ticker") {
      if (!ticker) {
        throw new Error("addEventListener('ticker', ...) requires a Ticker instance.");
      }
      ticker.addListener(handler as FrameCallback);
      return;
    }

    if (!(event in this._listeners)) {
      throw new Error("Invalid event type.");
    }

    (this._listeners[event as StageEventName] as StageEventHandler[]).push(
      handler as StageEventHandler,
    );
  }

  dispatchEvent(event: "resize"): void;
  dispatchEvent(event: StageEventName, payload: PointerEventPayload): void;
  dispatchEvent(event: StageEventName, payload?: PointerEventPayload): void {
    if (event === "resize") {
      for (const listener of this._listeners.resize) {
        listener();
      }
      return;
    }

    const listeners = this._listeners[event] as StageEventHandler[] | undefined;
    if (!listeners) {
      throw new Error("Invalid event type.");
    }

    for (const listener of listeners) {
      listener(payload);
    }
  }

  destroy(): void {
    stages.delete(this);
    this._listeners.resize.length = 0;
    this._listeners.pointerstart.length = 0;
    this._listeners.pointermove.length = 0;
    this._listeners.pointerend.length = 0;
  }

  // -- sizing ---------------------------------------------------------------

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.naturalWidth = width * this.dpr;
    this.naturalHeight = height * this.dpr;
    this.canvas.width = this.naturalWidth;
    this.canvas.height = this.naturalHeight;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.dispatchEvent("resize");
  }

  // -- pointer events -------------------------------------------------------

  pointerEvent(type: "start" | "move" | "end", x: number, y: number): void {
    const payload: PointerEventPayload = {
      type,
      x,
      y,
      onCanvas: x >= 0 && x <= this.width && y >= 0 && y <= this.height,
    };

    this.dispatchEvent(`pointer${type}` as "pointerstart" | "pointermove" | "pointerend", payload);
  }

  // -- static coordinate helpers --------------------------------------------

  static windowToCanvas(canvas: HTMLCanvasElement, x: number, y: number): { x: number; y: number } {
    const bounds = canvas.getBoundingClientRect();
    return {
      x: (x - bounds.left) * (canvas.width / bounds.width),
      y: (y - bounds.top) * (canvas.height / bounds.height),
    };
  }
}

// ---------------------------------------------------------------------------
// Global mouse / touch handlers (explicit init/cleanup, no module side-effects)
// ---------------------------------------------------------------------------

let lastTouchTimestamp = 0;
let handlersRegistered = false;

function mouseHandler(event: MouseEvent): void {
  if (Date.now() - lastTouchTimestamp < 500) {
    return;
  }

  let type: "start" | "move" | "end" = "start";
  if (event.type === "mousemove") {
    type = "move";
  } else if (event.type === "mouseup") {
    type = "end";
  }

  for (const stage of stages) {
    const position = Stage.windowToCanvas(stage.canvas, event.clientX, event.clientY);
    stage.pointerEvent(type, position.x / stage.dpr, position.y / stage.dpr);
  }
}

function touchHandler(event: TouchEvent): void {
  lastTouchTimestamp = Date.now();

  let type: "start" | "move" | "end" = "start";
  if (event.type === "touchmove") {
    type = "move";
  } else if (event.type === "touchend") {
    type = "end";
  }

  for (const stage of stages) {
    for (const touch of Array.from(event.changedTouches)) {
      let position: { x: number; y: number };
      if (type !== "end") {
        position = Stage.windowToCanvas(stage.canvas, touch.clientX, touch.clientY);
        stage._listeners.lastPointerPos = position;
        if (type === "start") {
          stage.pointerEvent("move", position.x / stage.dpr, position.y / stage.dpr);
        }
      } else {
        position = stage._listeners.lastPointerPos;
      }

      stage.pointerEvent(type, position.x / stage.dpr, position.y / stage.dpr);
    }
  }
}

/**
 * Register global mouse/touch event listeners on `document`.
 * Call once at app startup (e.g., in root layout or main component).
 * Safe to call multiple times — subsequent calls are no-ops.
 */
export function initGlobalHandlers(): void {
  if (typeof window === "undefined" || handlersRegistered) return;

  document.addEventListener("mousedown", mouseHandler);
  document.addEventListener("mousemove", mouseHandler);
  document.addEventListener("mouseup", mouseHandler);
  document.addEventListener("touchstart", touchHandler, { passive: true });
  document.addEventListener("touchmove", touchHandler, { passive: true });
  document.addEventListener("touchend", touchHandler);

  handlersRegistered = true;
}

/**
 * Remove global mouse/touch event listeners from `document`.
 * Call during app teardown or tests cleanup.
 */
export function cleanupGlobalHandlers(): void {
  if (typeof window === "undefined" || !handlersRegistered) return;

  document.removeEventListener("mousedown", mouseHandler);
  document.removeEventListener("mousemove", mouseHandler);
  document.removeEventListener("mouseup", mouseHandler);
  document.removeEventListener("touchstart", touchHandler);
  document.removeEventListener("touchmove", touchHandler);
  document.removeEventListener("touchend", touchHandler);

  handlersRegistered = false;
}
