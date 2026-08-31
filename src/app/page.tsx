"use client";

import { Canvas } from "@/components/Canvas/Canvas";
import { Toolbar } from "@/components/Toolbar";
import { Settings } from "@/components/Settings";
import { Help } from "@/components/Help";
import { Loader } from "@/components/Loader";

import { StoreContext } from "@/stores/storeContext";
import { useSimulator } from "./useSimulator";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FireworkSimulator() {
  const {
    ready,
    loadingStatus,
    stageSize,
    store,
    stageContainerRef,
    onTickerReady,
    onPointerStart,
    onPointerMove,
    onPointerEnd,
    handleConfigChange,
    handleBackgroundApply,
    handleBackgroundClear,
    handleToggleFullscreen,
    handleHelpOpen,
    handleClose,
  } = useSimulator();

  return (
    <StoreContext.Provider
      value={
        store as unknown as import("zustand").StoreApi<
          import("@/stores/fireworksStore").FireworksState
        >
      }
    >
      {!ready && <Loader status={loadingStatus} />}
      <div ref={stageContainerRef} className={`stage-container ${ready ? "" : "remove"}`}>
        <Canvas
          stageW={stageSize.w || 800}
          stageH={stageSize.h || 600}
          scaleFactor={1}
          onTickerReady={onTickerReady}
          onPointerStart={onPointerStart}
          onPointerMove={onPointerMove}
          onPointerEnd={onPointerEnd}
        />
        {ready && <Toolbar onToggleFullscreen={handleToggleFullscreen} />}
        {ready && (
          <Settings
            onConfigChange={handleConfigChange}
            onBackgroundApply={handleBackgroundApply}
            onBackgroundClear={handleBackgroundClear}
            onToggleFullscreen={handleToggleFullscreen}
            onHelpOpen={handleHelpOpen}
            onClose={handleClose}
          />
        )}
        {ready && <Help />}
      </div>
    </StoreContext.Provider>
  );
}
