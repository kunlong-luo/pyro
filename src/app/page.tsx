"use client";

import { SvgSprite } from "@/components/SvgSprite";
import { DualCanvas } from "@/components/Canvas/DualCanvas";
import { Controls } from "@/components/Controls";
import { Menu } from "@/components/Menu";
import { HelpModal } from "@/components/HelpModal";
import { LoadingInit } from "@/components/LoadingInit";

import { StoreContext } from "@/stores/storeContext";
import { useFireworksSimulator } from "./useFireworksSimulator";

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
  } = useFireworksSimulator();

  return (
    <StoreContext.Provider
      value={
        store as unknown as import("zustand").StoreApi<
          import("@/stores/fireworksStore").FireworksState
        >
      }
    >
      <SvgSprite />
      {!ready && <LoadingInit status={loadingStatus} />}
      <div ref={stageContainerRef} className={`stage-container ${ready ? "" : "remove"}`}>
        <DualCanvas
          stageW={stageSize.w || 800}
          stageH={stageSize.h || 600}
          scaleFactor={1}
          onTickerReady={onTickerReady}
          onPointerStart={onPointerStart}
          onPointerMove={onPointerMove}
          onPointerEnd={onPointerEnd}
        />
        {ready && <Controls />}
        {ready && (
          <Menu
            onConfigChange={handleConfigChange}
            onBackgroundApply={handleBackgroundApply}
            onBackgroundClear={handleBackgroundClear}
            onToggleFullscreen={handleToggleFullscreen}
            onHelpOpen={handleHelpOpen}
            onClose={handleClose}
          />
        )}
        {ready && <HelpModal />}
      </div>
    </StoreContext.Provider>
  );
}
