/**
 * Background resolution helpers extracted from runtime.js (1:1 port).
 *
 * Implements the fallback chain: user-configured → code default → none.
 * Every public function receives its dependencies as parameters so there
 * are no module-level side-effects or hidden globals.
 */

import { fireworksAppConfig } from "@/config/appConfig";
import type { Background } from "@/stores/fireworksStore";
import type { BackgroundSettings, ApplyResult } from "@/lib/background";

// ---------------------------------------------------------------------------
// BackgroundManager shape used by these helpers
// ---------------------------------------------------------------------------

export interface BackgroundManager {
  applyBackground(candidate: string | BackgroundSettings): Promise<ApplyResult>;
  clearBackground(): unknown;
  setStatus(message: string, state: string): void;
}

// ---------------------------------------------------------------------------
// getCodeDefaultBackground
// ---------------------------------------------------------------------------

export function getCodeDefaultBackground(): Background {
  const defaultBackground = fireworksAppConfig.defaultBackground || {};
  const value = typeof defaultBackground.value === "string" ? defaultBackground.value.trim() : "";

  if (!value) {
    return {
      mode: "none",
      value: "",
      configured: false,
    };
  }

  return {
    mode: defaultBackground.mode === "style" ? "style" : "image",
    value,
    configured: false,
  };
}

// ---------------------------------------------------------------------------
// resolvePreferredBackground
// ---------------------------------------------------------------------------

export function resolvePreferredBackground(currentBackground: Background): {
  source: "user" | "default" | "none";
  background: Background;
} {
  if (currentBackground.configured && currentBackground.value) {
    return {
      source: "user",
      background: currentBackground,
    };
  }

  const codeDefaultBackground = getCodeDefaultBackground();
  if (codeDefaultBackground.value) {
    return {
      source: "default",
      background: codeDefaultBackground,
    };
  }

  return {
    source: "none",
    background: {
      mode: "none",
      value: "",
      configured: false,
    },
  };
}

// ---------------------------------------------------------------------------
// applyResolvedBackground
// ---------------------------------------------------------------------------

export function applyResolvedBackground(
  backgroundManager: BackgroundManager,
  currentBackground: Background,
): void {
  const resolvedBackground = resolvePreferredBackground(currentBackground);

  if (resolvedBackground.source === "user") {
    backgroundManager
      .applyBackground(resolvedBackground.background as BackgroundSettings)
      .then((result) => {
        if (result.ok) {
          backgroundManager.setStatus("正在使用网页端背景", "success");
          return;
        }

        const fallbackBackground = getCodeDefaultBackground();
        if (!fallbackBackground.value) {
          backgroundManager.clearBackground();
          backgroundManager.setStatus("网页端背景无效，当前未显示背景", "error");
          return;
        }

        backgroundManager
          .applyBackground(fallbackBackground as BackgroundSettings)
          .then((fallbackResult) => {
            if (fallbackResult.ok) {
              backgroundManager.setStatus("网页端背景无效，已回退到代码默认背景", "idle");
              return;
            }

            backgroundManager.clearBackground();
            backgroundManager.setStatus("网页端背景和代码默认背景都无效", "error");
          });
      });
    return;
  }

  if (resolvedBackground.source === "default") {
    backgroundManager
      .applyBackground(resolvedBackground.background as BackgroundSettings)
      .then((result) => {
        if (result.ok) {
          backgroundManager.setStatus("正在使用代码默认背景", "idle");
          return;
        }

        backgroundManager.clearBackground();
        backgroundManager.setStatus("代码默认背景无效，当前未显示背景", "error");
      });
    return;
  }

  backgroundManager.clearBackground();
}
