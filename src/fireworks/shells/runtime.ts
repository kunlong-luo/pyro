/**
 * Explicit mutable state for a single fireworks session.
 * Create via {@link createShellRuntime} — never share across independent
 * simulations (tests, multiple canvases, etc.).
 */
export interface ShellRuntime {
  /** Last color returned by {@link randomColor} (used for notSame avoidance). */
  lastColor: string | undefined;
  /** Whether the next {@link startSequence} call is the very first one. */
  isFirstSeq: boolean;
  /** Number of rapid-fire finale shells launched so far in the current burst. */
  currentFinaleCount: number;
  /** Timestamp (ms) of the last {@link seqSmallBarrage} invocation. */
  seqSmallBarrageLastCalled: number;
}

/**
 * Create a fresh {@link ShellRuntime} for a new fireworks session.
 * Each runtime is fully independent — safe for concurrent use.
 */
export function createShellRuntime(): ShellRuntime {
  return {
    lastColor: undefined,
    isFirstSeq: true,
    currentFinaleCount: 0,
    seqSmallBarrageLastCalled: Date.now(),
  };
}
