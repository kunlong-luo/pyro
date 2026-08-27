/**
 * Word-burst tracker extracted from runtime.js (1:1 port).
 *
 * Tracks shell launches since the last word burst and decides whether the
 * next shell should force a word burst.
 */

import { fireworksAppConfig } from "@/config/appConfig";

// ---------------------------------------------------------------------------
// Shell shape expected by shouldCreateBurst
// ---------------------------------------------------------------------------

export interface Shell {
  disableWord?: boolean;
  comet?: boolean;
  forceWordBurst?: boolean;
}

// ---------------------------------------------------------------------------
// WordBurstTracker interface
// ---------------------------------------------------------------------------

export interface WordBurstTracker {
  shellsSinceLastBurst: number;
  forceNextBurst: boolean;
  reset(): void;
  queueBurst(): void;
  shouldCreateBurst(shell: Shell, wordShellEnabled: boolean): boolean;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createWordBurstTracker(): WordBurstTracker {
  return {
    shellsSinceLastBurst: 0,
    forceNextBurst: true,

    reset() {
      this.shellsSinceLastBurst = 0;
      this.forceNextBurst = false;
    },

    queueBurst() {
      this.forceNextBurst = true;
    },

    shouldCreateBurst(shell: Shell, wordShellEnabled: boolean): boolean {
      if (!wordShellEnabled || shell.disableWord || !shell.comet) {
        return false;
      }

      if (shell.forceWordBurst || this.forceNextBurst) {
        this.reset();
        return true;
      }

      this.shellsSinceLastBurst += 1;
      if (this.shellsSinceLastBurst >= fireworksAppConfig.wordBurstInterval) {
        this.shellsSinceLastBurst = 0;
        return true;
      }

      return false;
    },
  };
}
