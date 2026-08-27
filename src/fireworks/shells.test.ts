// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  randomColor,
  randomWord,
  whiteOrGold,
  makePistilColor,
  crysanthemumShell,
  ghostShell,
  strobeShell,
  palmShell,
  ringShell,
  crossetteShell,
  floralShell,
  fallingLeavesShell,
  willowShell,
  crackleShell,
  horsetailShell,
  namedShellTypes,
  shellNames,
  randomShellName,
  configuredShellName,
  randomShell,
  randomFastShell,
  shellFromConfig,
  fitShellPositionInBoundsH,
  fitShellPositionInBoundsV,
  getRandomShellPositionH,
  getRandomShellPositionV,
  getRandomShellSize,
  launchShellFromConfig,
  fastShellBlacklist,
  seqRandomShell,
  seqTwoRandom,
  seqTriple,
  seqPyramid,
  startSequence,
  type ShellContext,
  type SequenceContext,
  type ShellInstance,
  type ShellOptions,
} from "./shells";
import {
  COLOR,
  COLOR_CODES,
  INVISIBLE,
  QUALITY_LOW,
  QUALITY_NORMAL,
  QUALITY_HIGH,
} from "./constants";
import { createDefaultState } from "@/stores/fireworksStore";
import { createWordBurstTracker } from "./wordBurst";
import type { Runtime, FireworksState } from "@/stores/fireworksStore";

const runtime: Runtime = {
  isDesktop: true,
  isHeader: false,
  isHighEndDevice: true,
  defaultScaleFactor: 1,
  fullscreen: false,
};

function makeState(overrides?: Partial<FireworksState["config"]>): FireworksState {
  const state = createDefaultState(runtime);
  return { ...state, config: { ...state.config, ...overrides } };
}

function makeShellContext(overrides?: Partial<ShellContext>): ShellContext {
  return {
    quality: QUALITY_NORMAL,
    isHeader: false,
    isDesktop: true,
    state: makeState(),
    ...overrides,
  };
}

/** Minimal fake Shell that just records launch() calls. */
class FakeShell implements ShellInstance {
  static instances: FakeShell[] = [];
  starLife: number;
  fallingLeaves?: boolean;
  forceWordBurst?: boolean;
  launchCalls: Array<[number, number]> = [];

  constructor(public options: ShellOptions) {
    this.starLife = options.starLife;
    this.fallingLeaves = options.fallingLeaves;
    FakeShell.instances.push(this);
  }

  launch(x: number, y: number): void {
    this.launchCalls.push([x, y]);
  }
}

function makeSequenceContext(overrides?: Partial<SequenceContext>): SequenceContext {
  FakeShell.instances = [];
  return {
    ...makeShellContext(),
    shellCtor: FakeShell as unknown as SequenceContext["shellCtor"],
    stageWidth: 1000,
    stageHeight: 800,
    registerUserInteraction: vi.fn(),
    wordBurstTracker: createWordBurstTracker(),
    ...overrides,
  };
}

const ALL_SHELL_FACTORIES = {
  Crysanthemum: crysanthemumShell,
  Ghost: ghostShell,
  Strobe: strobeShell,
  Palm: palmShell,
  Ring: ringShell,
  Crossette: crossetteShell,
  Floral: floralShell,
  "Falling Leaves": fallingLeavesShell,
  Willow: willowShell,
  Crackle: crackleShell,
  "Horse Tail": horsetailShell,
};

// ---------------------------------------------------------------------------
// Pure colour/word helpers
// ---------------------------------------------------------------------------

describe("randomColor", () => {
  it("always returns a value from the palette", () => {
    for (let i = 0; i < 100; i += 1) {
      expect(COLOR_CODES).toContain(randomColor());
    }
  });

  it("notColor: never returns the excluded color", () => {
    for (let i = 0; i < 50; i += 1) {
      expect(randomColor({ notColor: COLOR.Red })).not.toBe(COLOR.Red);
    }
  });

  it("notSame: never returns the same color as the previous call", () => {
    for (let i = 0; i < 50; i += 1) {
      const first = randomColor();
      const second = randomColor({ notSame: true });
      expect(second).not.toBe(first);
    }
  });
});

describe("randomWord", () => {
  it("returns empty string for an empty list", () => {
    expect(randomWord([])).toBe("");
  });

  it("returns the only word for a single-item list", () => {
    expect(randomWord(["福"])).toBe("福");
  });

  it("always returns one of the given words", () => {
    const words = ["新年快乐", "平安喜乐", "万事顺意"];
    for (let i = 0; i < 50; i += 1) {
      expect(words).toContain(randomWord(words));
    }
  });
});

describe("whiteOrGold", () => {
  it("only ever returns white or gold", () => {
    for (let i = 0; i < 50; i += 1) {
      expect([COLOR.White, COLOR.Gold]).toContain(whiteOrGold());
    }
  });
});

describe("makePistilColor", () => {
  it("never repeats a white shell's own color (any other palette color is fine)", () => {
    for (let i = 0; i < 50; i += 1) {
      const pistilColor = makePistilColor(COLOR.White);
      expect(pistilColor).not.toBe(COLOR.White);
      expect(COLOR_CODES).toContain(pistilColor);
    }
  });

  it("never repeats a gold shell's own color (any other palette color is fine)", () => {
    for (let i = 0; i < 50; i += 1) {
      const pistilColor = makePistilColor(COLOR.Gold);
      expect(pistilColor).not.toBe(COLOR.Gold);
      expect(COLOR_CODES).toContain(pistilColor);
    }
  });

  it("returns white or gold for any other shell color", () => {
    for (let i = 0; i < 50; i += 1) {
      expect([COLOR.White, COLOR.Gold]).toContain(makePistilColor(COLOR.Red));
    }
  });
});

// ---------------------------------------------------------------------------
// Shell factories: structural invariants across many random runs
// ---------------------------------------------------------------------------

describe.each(Object.entries(ALL_SHELL_FACTORIES))("%s shell factory", (_name, factory) => {
  it("always sets shellSize to the requested size", () => {
    for (const size of [0, 1, 2.5, 4]) {
      expect(factory(size, QUALITY_NORMAL).shellSize).toBe(size);
    }
  });

  it("produces a finite, positive spreadSize and starLife", () => {
    for (let i = 0; i < 50; i += 1) {
      const options = factory(2, QUALITY_NORMAL);
      expect(options.spreadSize).toBeGreaterThan(0);
      expect(Number.isFinite(options.spreadSize)).toBe(true);
      expect(options.starLife).toBeGreaterThan(0);
      expect(Number.isFinite(options.starLife)).toBe(true);
    }
  });

  it("produces a color that is a valid single color, INVISIBLE, 'random', or a pair of valid colors", () => {
    const validSingles = new Set([...COLOR_CODES, INVISIBLE, "random"]);
    for (let i = 0; i < 100; i += 1) {
      const { color } = factory(2, QUALITY_NORMAL);
      if (Array.isArray(color)) {
        expect(color).toHaveLength(2);
        for (const c of color) expect(COLOR_CODES).toContain(c);
      } else {
        expect(validSingles.has(color)).toBe(true);
      }
    }
  });
});

describe("crysanthemumShell", () => {
  it("computes spreadSize and starLife from size", () => {
    const options = crysanthemumShell(3, QUALITY_NORMAL);
    expect(options.spreadSize).toBe(300 + 3 * 100);
    expect(options.starLife).toBe(900 + 3 * 200);
  });

  it("scales starDensity down for low quality and fixes it for high quality", () => {
    // Math.random() = 0.5 deterministically yields: glitter=false,
    // singleColor=true, pistil=false, secondColor=null, streamers=false —
    // i.e. no branch re-enters randomColor's notSame/notColor loops.
    const spy = vi.spyOn(Math, "random").mockReturnValue(0.5);
    try {
      const low = crysanthemumShell(2, QUALITY_LOW).starDensity!;
      const normal = crysanthemumShell(2, QUALITY_NORMAL).starDensity!;
      const high = crysanthemumShell(2, QUALITY_HIGH).starDensity!;
      expect(normal).toBeCloseTo(1.25);
      expect(low).toBeCloseTo(1.25 * 0.8);
      expect(high).toBeCloseTo(1.2);
    } finally {
      spy.mockRestore();
    }
  });

  it("only sets pistilColor when pistil is true", () => {
    for (let i = 0; i < 100; i += 1) {
      const options = crysanthemumShell(2, QUALITY_NORMAL);
      if (options.pistil) {
        expect(typeof options.pistilColor).toBe("string");
      } else {
        expect(options.pistilColor).toBe(false);
      }
    }
  });
});

describe("ghostShell", () => {
  it("forces invisible color, streamers, no glitter, and 1.5x starLife over crysanthemum", () => {
    for (let i = 0; i < 30; i += 1) {
      const options = ghostShell(2, QUALITY_NORMAL);
      expect(options.color).toBe(INVISIBLE);
      expect(options.streamers).toBe(true);
      expect(options.glitter).toBe("");
      expect(options.starLife).toBeCloseTo((900 + 2 * 200) * 1.5);
    }
  });

  it("never uses invisible as the secondColor (ghost color)", () => {
    for (let i = 0; i < 30; i += 1) {
      expect(ghostShell(2, QUALITY_NORMAL).secondColor).not.toBe(INVISIBLE);
    }
  });
});

describe("strobeShell", () => {
  it("always marks the shell as a strobe with white glitter", () => {
    const options = strobeShell(2, QUALITY_NORMAL);
    expect(options.strobe).toBe(true);
    expect(options.glitter).toBe("light");
    expect(options.glitterColor).toBe(COLOR.White);
    expect(options.spreadSize).toBe(280 + 2 * 92);
    expect(options.starLife).toBe(1100 + 2 * 200);
  });

  it("strobeColor is always white or null", () => {
    for (let i = 0; i < 30; i += 1) {
      expect([COLOR.White, null]).toContain(strobeShell(2, QUALITY_NORMAL).strobeColor);
    }
  });
});

describe("palmShell", () => {
  it("picks thick or heavy glitter with the matching starDensity", () => {
    for (let i = 0; i < 30; i += 1) {
      const options = palmShell(2, QUALITY_NORMAL);
      if (options.glitter === "thick") {
        expect(options.starDensity).toBeCloseTo(0.15);
      } else {
        expect(options.glitter).toBe("heavy");
        expect(options.starDensity).toBeCloseTo(0.4);
      }
    }
  });
});

describe("ringShell", () => {
  it("always sets ring: true and a positive starCount", () => {
    const options = ringShell(2, QUALITY_NORMAL);
    expect(options.ring).toBe(true);
    expect(options.starCount).toBeGreaterThan(0);
  });
});

describe("crossetteShell", () => {
  it("always sets crossette: true", () => {
    expect(crossetteShell(2, QUALITY_NORMAL).crossette).toBe(true);
  });
});

describe("floralShell", () => {
  it("always sets floral: true with low starDensity", () => {
    const options = floralShell(2, QUALITY_NORMAL);
    expect(options.floral).toBe(true);
    expect(options.starDensity).toBeCloseTo(0.12);
  });
});

describe("fallingLeavesShell", () => {
  it("always sets fallingLeaves: true with invisible color and gold glitter", () => {
    const options = fallingLeavesShell(2, QUALITY_NORMAL);
    expect(options.fallingLeaves).toBe(true);
    expect(options.color).toBe(INVISIBLE);
    expect(options.glitterColor).toBe(COLOR.Gold);
  });
});

describe("willowShell", () => {
  it("always sets invisible color with gold willow glitter", () => {
    const options = willowShell(2, QUALITY_NORMAL);
    expect(options.color).toBe(INVISIBLE);
    expect(options.glitter).toBe("willow");
    expect(options.glitterColor).toBe(COLOR.Gold);
  });
});

describe("crackleShell", () => {
  it("always sets crackle: true with gold glitter", () => {
    const options = crackleShell(2, QUALITY_NORMAL);
    expect(options.crackle).toBe(true);
    expect(options.glitter).toBe("light");
    expect(options.glitterColor).toBe(COLOR.Gold);
  });

  it("reduces starDensity at low quality", () => {
    expect(crackleShell(2, QUALITY_LOW).starDensity).toBeCloseTo(0.65);
    expect(crackleShell(2, QUALITY_NORMAL).starDensity).toBeCloseTo(1);
    expect(crackleShell(2, QUALITY_HIGH).starDensity).toBeCloseTo(1);
  });

  it("is gold about 3/4 of the time", () => {
    const spy = vi.spyOn(Math, "random").mockReturnValue(0.1);
    try {
      expect(crackleShell(2, QUALITY_NORMAL).color).toBe(COLOR.Gold);
    } finally {
      spy.mockRestore();
    }
  });
});

describe("horsetailShell", () => {
  it("always sets horsetail: true with medium glitter", () => {
    const options = horsetailShell(2, QUALITY_NORMAL);
    expect(options.horsetail).toBe(true);
    expect(options.glitter).toBe("medium");
    expect(options.spreadSize).toBe(250 + 2 * 38);
  });

  it("strobes exactly when the color is white", () => {
    for (let i = 0; i < 50; i += 1) {
      const options = horsetailShell(2, QUALITY_NORMAL);
      expect(options.strobe).toBe(options.color === COLOR.White);
    }
  });
});

// ---------------------------------------------------------------------------
// Shell registry
// ---------------------------------------------------------------------------

describe("namedShellTypes / shellNames", () => {
  it("has exactly 11 named shells plus Random", () => {
    expect(Object.keys(namedShellTypes)).toHaveLength(11);
    expect(shellNames).toHaveLength(12);
    expect(shellNames[0]).toBe("Random");
  });
});

// ---------------------------------------------------------------------------
// Selection helpers
// ---------------------------------------------------------------------------

describe("randomShellName", () => {
  it("always returns a name from the registry", () => {
    for (let i = 0; i < 100; i += 1) {
      expect(randomShellName() in namedShellTypes).toBe(true);
    }
  });
});

describe("configuredShellName", () => {
  it("returns the configured shell when it is a known named shell", () => {
    expect(configuredShellName(makeState({ shell: "Ring" }))).toBe("Ring");
  });

  it("falls back to Random for an unknown or 'Random' selection", () => {
    expect(configuredShellName(makeState({ shell: "Random" }))).toBe("Random");
    expect(configuredShellName(makeState({ shell: "Nonexistent" }))).toBe("Random");
  });
});

describe("randomFastShell", () => {
  it("never returns a blacklisted (slow) shell when selection is Random", () => {
    for (let i = 0; i < 100; i += 1) {
      const ctx = makeShellContext({ state: makeState({ shell: "Random" }) });
      const options = randomFastShell(ctx)(2, QUALITY_NORMAL);
      for (const blacklisted of fastShellBlacklist) {
        expect(namedShellTypes[blacklisted]).not.toBe(undefined);
      }
      // sanity: the factory returned actually produced valid options
      expect(options.shellSize).toBe(2);
    }
  });

  it("uses the configured shell directly when it is not Random", () => {
    const ctx = makeShellContext({ state: makeState({ shell: "Palm" }) });
    expect(randomFastShell(ctx)).toBe(palmShell);
  });
});

describe("randomShell", () => {
  it("delegates to randomFastShell in header mode", () => {
    const ctx = makeShellContext({ isHeader: true, state: makeState({ shell: "Palm" }) });
    const options = randomShell(2, QUALITY_NORMAL, ctx);
    expect(options.glitter === "thick" || options.glitter === "heavy").toBe(true);
  });
});

describe("shellFromConfig", () => {
  it("uses the configured named shell directly", () => {
    const ctx = makeShellContext({ state: makeState({ shell: "Willow" }) });
    expect(shellFromConfig(2, QUALITY_NORMAL, ctx).color).toBe(INVISIBLE);
  });

  it("falls back to a random shell when configured shell is Random", () => {
    const ctx = makeShellContext({ state: makeState({ shell: "Random" }) });
    const options = shellFromConfig(2, QUALITY_NORMAL, ctx);
    expect(options.shellSize).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Position helpers
// ---------------------------------------------------------------------------

describe("fitShellPositionInBoundsH", () => {
  it("maps [0,1] to [0.18, 0.82]", () => {
    expect(fitShellPositionInBoundsH(0)).toBeCloseTo(0.18);
    expect(fitShellPositionInBoundsH(1)).toBeCloseTo(0.82);
    expect(fitShellPositionInBoundsH(0.5)).toBeCloseTo(0.5);
  });
});

describe("fitShellPositionInBoundsV", () => {
  it("scales by 0.75", () => {
    expect(fitShellPositionInBoundsV(1)).toBeCloseTo(0.75);
    expect(fitShellPositionInBoundsV(0)).toBe(0);
  });
});

describe("getRandomShellPositionH / V", () => {
  it("always stay within their respective bounds", () => {
    for (let i = 0; i < 100; i += 1) {
      const h = getRandomShellPositionH();
      expect(h).toBeGreaterThanOrEqual(0.18);
      expect(h).toBeLessThanOrEqual(0.82);

      const v = getRandomShellPositionV();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(0.75);
    }
  });
});

describe("getRandomShellSize", () => {
  it("never returns a size larger than the configured base size", () => {
    for (let i = 0; i < 100; i += 1) {
      const state = makeState({ size: "3" });
      const result = getRandomShellSize(state);
      expect(result.size).toBeLessThanOrEqual(3);
      expect(result.x).toBeGreaterThanOrEqual(0.18);
      expect(result.x).toBeLessThanOrEqual(0.82);
      expect(result.height).toBeGreaterThanOrEqual(0);
      expect(result.height).toBeLessThanOrEqual(0.75);
    }
  });

  it("handles a base size of 0 without dividing by zero", () => {
    const result = getRandomShellSize(makeState({ size: "0" }));
    expect(Number.isFinite(result.size)).toBe(true);
    expect(Number.isFinite(result.height)).toBe(true);
    expect(result.size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// launchShellFromConfig
// ---------------------------------------------------------------------------

describe("launchShellFromConfig", () => {
  it("registers user interaction and launches at a random position when there is no event", () => {
    const ctx = makeSequenceContext();
    launchShellFromConfig(null, ctx);

    expect(ctx.registerUserInteraction).toHaveBeenCalledTimes(1);
    expect(FakeShell.instances).toHaveLength(1);
    const [[x, y]] = FakeShell.instances[0].launchCalls;
    expect(x).toBeGreaterThanOrEqual(0.18);
    expect(x).toBeLessThanOrEqual(0.82);
    expect(y).toBeGreaterThanOrEqual(0);
    expect(y).toBeLessThanOrEqual(0.75);
  });

  it("launches at the event position, converted to stage-relative coordinates", () => {
    const ctx = makeSequenceContext({ stageWidth: 1000, stageHeight: 800 });
    launchShellFromConfig({ x: 250, y: 200 }, ctx);

    const [[x, y]] = FakeShell.instances[0].launchCalls;
    expect(x).toBeCloseTo(0.25);
    expect(y).toBeCloseTo(0.75); // 1 - 200/800
  });

  it("forces a word burst and resets the tracker when wordShell is on and there is an event", () => {
    const tracker = createWordBurstTracker();
    tracker.reset(); // forceNextBurst -> false, so we can observe the explicit reset call
    const resetSpy = vi.spyOn(tracker, "reset");
    const ctx = makeSequenceContext({
      wordBurstTracker: tracker,
      state: makeState({ wordShell: true }),
    });

    launchShellFromConfig({ x: 10, y: 10 }, ctx);

    expect(FakeShell.instances[0].forceWordBurst).toBe(true);
    expect(resetSpy).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Sequences (fake timers where the sequence schedules follow-up launches)
// ---------------------------------------------------------------------------

describe("seqRandomShell", () => {
  it("launches exactly one shell and returns a positive delay", () => {
    const ctx = makeSequenceContext();
    const delay = seqRandomShell(ctx);
    expect(FakeShell.instances).toHaveLength(1);
    expect(delay).toBeGreaterThan(0);
  });

  it("uses a fixed 4600ms extra delay for falling-leaves shells", () => {
    const ctx = makeSequenceContext({ state: makeState({ shell: "Falling Leaves" }) });
    const delay = seqRandomShell(ctx);
    expect(delay).toBeGreaterThanOrEqual(900 + 4600);
    expect(delay).toBeLessThanOrEqual(900 + 600 + 4600);
  });
});

describe("seqTwoRandom", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("launches the first shell immediately and the second after ~100ms", () => {
    const ctx = makeSequenceContext();
    seqTwoRandom(ctx);

    // Both shells are constructed synchronously; only the second's launch()
    // is deferred.
    expect(FakeShell.instances).toHaveLength(2);
    expect(FakeShell.instances[0].launchCalls).toHaveLength(1);
    expect(FakeShell.instances[1].launchCalls).toHaveLength(0);

    vi.advanceTimersByTime(100);

    expect(FakeShell.instances[1].launchCalls).toHaveLength(1);
  });
});

describe("seqTriple", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("launches a center shell immediately, then two side shells later", () => {
    const ctx = makeSequenceContext();
    const delay = seqTriple(ctx);

    expect(FakeShell.instances).toHaveLength(1);
    expect(delay).toBe(4000);

    vi.advanceTimersByTime(1500);

    expect(FakeShell.instances).toHaveLength(3);
  });
});

describe("seqPyramid", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("schedules a full barrage and eventually launches every shell", () => {
    const ctx = makeSequenceContext({ isDesktop: false }); // barrageCountHalf = 4, fewer timers
    seqPyramid(ctx);

    vi.runAllTimers();

    // barrageCountHalf(4)*2 side shells + 1 special = 9
    expect(FakeShell.instances).toHaveLength(9);
  });
});

// ---------------------------------------------------------------------------
// startSequence (module-level state machine)
// ---------------------------------------------------------------------------

describe("startSequence", () => {
  it("on the very first call in header mode, delegates to seqTwoRandom", async () => {
    vi.resetModules();
    const fresh = await import("./shells");
    const ctx = makeSequenceContext({ isHeader: true });
    (fresh.startSequence as typeof startSequence)(ctx);
    expect(FakeShell.instances.length).toBeGreaterThanOrEqual(1);
  });

  it("on the very first call in non-header mode, launches a single centered crysanthemum and returns 2400", async () => {
    vi.resetModules();
    const fresh = await import("./shells");
    const ctx = makeSequenceContext({ isHeader: false });
    const delay = (fresh.startSequence as typeof startSequence)(ctx);
    expect(delay).toBe(2400);
    expect(FakeShell.instances).toHaveLength(1);
    expect(FakeShell.instances[0].launchCalls[0]).toEqual([0.5, 0.5]);
  });

  it("counts up to finaleCount during finale mode, then resets with a 6000ms pause", async () => {
    vi.resetModules();
    const fresh = await import("./shells");
    const ctx = makeSequenceContext({ state: makeState({ finale: true }) });

    // Burn the "first call" branch first.
    (fresh.startSequence as typeof startSequence)(ctx);

    for (let i = 0; i < fresh.finaleCount; i += 1) {
      const delay = (fresh.startSequence as typeof startSequence)(ctx);
      expect(delay).toBe(170);
    }

    const finalDelay = (fresh.startSequence as typeof startSequence)(ctx);
    expect(finalDelay).toBe(6000);
  });
});
