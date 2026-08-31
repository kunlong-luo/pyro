"use client";

import { useRef, useEffect, useLayoutEffect } from "react";
import { Stage, createTicker } from "@/lib/stage";
import type { PointerEventPayload, Ticker } from "@/lib/stage";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CanvasProps {
  /** Logical width passed to Stage.resize(). */
  stageW: number;
  /** Logical height passed to Stage.resize(). */
  stageH: number;
  /** Scale factor applied during rendering (consumed by the simulation, not by Stage directly). */
  scaleFactor: number;
  /** Called when a pointer-down occurs on either canvas. */
  onPointerStart?: (payload: PointerEventPayload) => void;
  /** Called when a pointer-move occurs on either canvas. */
  onPointerMove?: (payload: PointerEventPayload) => void;
  /** Called when a pointer-up occurs on either canvas. */
  onPointerEnd?: (payload: PointerEventPayload) => void;
  /** Called after both stages have been resized. */
  onResize?: (width: number, height: number) => void;
  /** Called once with the Ticker and both Stage instances so the parent can register frame listeners and use them for rendering. */
  onTickerReady?: (ticker: Ticker, trailsStage: Stage, mainStage: Stage) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Canvas({
  stageW,
  stageH,
  onPointerStart,
  onPointerMove,
  onPointerEnd,
  onResize,
  onTickerReady,
}: CanvasProps) {
  // -- refs for DOM elements --------------------------------------------------
  const trailsRef = useRef<HTMLCanvasElement>(null);
  const mainRef = useRef<HTMLCanvasElement>(null);

  // -- refs for imperative Stage / Ticker instances (never in React state) -----
  const trailsStageRef = useRef<Stage | null>(null);
  const mainStageRef = useRef<Stage | null>(null);
  const tickerRef = useRef<Ticker | null>(null);

  // -- latest-callback refs so the mount effect never goes stale ---------------
  const callbacksRef = useRef({
    onPointerStart,
    onPointerMove,
    onPointerEnd,
    onResize,
    onTickerReady,
  });

  // Update callbacks ref after every render (useLayoutEffect to avoid flicker)
  useLayoutEffect(() => {
    callbacksRef.current = {
      onPointerStart,
      onPointerMove,
      onPointerEnd,
      onResize,
      onTickerReady,
    };
  });

  // =========================================================================
  // Mount: create Stage instances + Ticker, wire pointer events
  // =========================================================================
  useEffect(() => {
    const trailsCanvas = trailsRef.current;
    const mainCanvas = mainRef.current;
    if (!trailsCanvas || !mainCanvas) return;

    const trailsStage = new Stage(trailsCanvas);
    const mainStage = new Stage(mainCanvas);
    const ticker = createTicker();

    trailsStageRef.current = trailsStage;
    mainStageRef.current = mainStage;
    tickerRef.current = ticker;

    // Thin wrappers that read the latest callback via ref so we never need to
    // re-register listeners when props change.
    const handleStart = (payload?: PointerEventPayload) => {
      callbacksRef.current.onPointerStart?.(payload!);
    };
    const handleMove = (payload?: PointerEventPayload) => {
      callbacksRef.current.onPointerMove?.(payload!);
    };
    const handleEnd = (payload?: PointerEventPayload) => {
      callbacksRef.current.onPointerEnd?.(payload!);
    };

    trailsStage.addEventListener("pointerstart", handleStart);
    trailsStage.addEventListener("pointermove", handleMove);
    trailsStage.addEventListener("pointerend", handleEnd);
    mainStage.addEventListener("pointerstart", handleStart);
    mainStage.addEventListener("pointermove", handleMove);
    mainStage.addEventListener("pointerend", handleEnd);

    callbacksRef.current.onTickerReady?.(ticker, trailsStage, mainStage);

    return () => {
      trailsStageRef.current?.destroy();
      mainStageRef.current?.destroy();
      trailsStageRef.current = null;
      mainStageRef.current = null;
      tickerRef.current = null;
    };
  }, []);

  // =========================================================================
  // Resize: sync Stage dimensions when props change
  // =========================================================================
  useEffect(() => {
    const trailsStage = trailsStageRef.current;
    const mainStage = mainStageRef.current;
    if (!trailsStage || !mainStage) return;

    trailsStage.resize(stageW, stageH);
    mainStage.resize(stageW, stageH);
    callbacksRef.current.onResize?.(stageW, stageH);
  }, [stageW, stageH]);

  // =========================================================================
  // Render
  // =========================================================================
  return (
    <div className="canvas-container">
      <canvas id="trails-canvas" ref={trailsRef} />
      <canvas id="main-canvas" ref={mainRef} />
    </div>
  );
}
