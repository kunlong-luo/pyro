/**
 * Device-detection helpers extracted from runtime.js (1:1 port).
 *
 * Thresholds preserved exactly: 640 (mobile), 800 (desktop),
 * 1024 / 4 / 8 (high-end heuristic).
 */

// ---------------------------------------------------------------------------
// Viewport / device classification
// ---------------------------------------------------------------------------

export const IS_MOBILE = window.innerWidth <= 640;
export const IS_DESKTOP = window.innerWidth > 800;
export const IS_HEADER = IS_DESKTOP && window.innerHeight < 300;

export const IS_HIGH_END_DEVICE = (() => {
	const hardwareConcurrency = navigator.hardwareConcurrency;
	if (!hardwareConcurrency) {
		return false;
	}

	const minimumCoreCount = window.innerWidth <= 1024 ? 4 : 8;
	return hardwareConcurrency >= minimumCoreCount;
})();

// ---------------------------------------------------------------------------
// Default scale factor
// ---------------------------------------------------------------------------

export function getDefaultScaleFactor(): number {
	if (IS_MOBILE) {
		return 0.9;
	}

	if (IS_HEADER) {
		return 0.75;
	}

	return 1;
}
