/**
 * Device-detection helpers extracted from runtime.js (1:1 port).
 *
 * Thresholds preserved exactly: 640 (mobile), 800 (desktop),
 * 1024 / 4 / 8 (high-end heuristic).
 */

// ---------------------------------------------------------------------------
// Viewport / device classification
// ---------------------------------------------------------------------------

function getIsMobile(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth <= 640;
}

function getIsDesktop(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth > 800;
}

function getIsHeader(): boolean {
  if (typeof window === "undefined") return false;
  return getIsDesktop() && window.innerHeight < 300;
}

function getIsHighEndDevice(): boolean {
  if (typeof window === "undefined") return false;
  const hardwareConcurrency = navigator.hardwareConcurrency;
  if (!hardwareConcurrency) return false;
  const minimumCoreCount = window.innerWidth <= 1024 ? 4 : 8;
  return hardwareConcurrency >= minimumCoreCount;
}

// Exported getters (functions) so they can be called at runtime
export const IS_MOBILE = getIsMobile();
export const IS_DESKTOP = getIsDesktop();
export const IS_HEADER = getIsHeader();
export const IS_HIGH_END_DEVICE = getIsHighEndDevice();

// ---------------------------------------------------------------------------
// Default scale factor
// ---------------------------------------------------------------------------

export function getDefaultScaleFactor(): number {
  if (IS_MOBILE) return 0.9;
  if (IS_HEADER) return 0.75;
  return 1;
}
