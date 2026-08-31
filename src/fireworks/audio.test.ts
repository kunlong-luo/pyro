// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createSoundManager, type SoundManagerDeps, type SoundType } from "./audio";

// ---------------------------------------------------------------------------
// Minimal Web Audio API mock (jsdom does not implement AudioContext at all)
// ---------------------------------------------------------------------------

class FakeGainNode {
  gain = { value: 1 };
  connect = vi.fn();
  disconnect = vi.fn();
}

class FakeBufferSource {
  playbackRate = { value: 1 };
  buffer: unknown = null;
  connect = vi.fn();
  disconnect = vi.fn();
  start = vi.fn();
  onended: (() => void) | null = null;
}

class FakeAudioContext {
  static instanceCount = 0;
  destination = {};
  suspend = vi.fn().mockResolvedValue(undefined);
  resume = vi.fn().mockResolvedValue(undefined);
  decodeAudioData = vi.fn((_buffer: ArrayBuffer, resolve: (buf: AudioBuffer) => void) =>
    resolve({} as AudioBuffer),
  );
  createGain = vi.fn(() => new FakeGainNode());
  createBufferSource = vi.fn(() => new FakeBufferSource());

  constructor() {
    FakeAudioContext.instanceCount += 1;
  }
}

function makeDeps(overrides?: Partial<SoundManagerDeps>): SoundManagerDeps {
  return {
    getCanPlaySound: () => true,
    getSimSpeed: () => 1,
    ...overrides,
  };
}

beforeEach(() => {
  FakeAudioContext.instanceCount = 0;
  vi.stubGlobal("AudioContext", FakeAudioContext);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// registerInteraction / ensureContext
// ---------------------------------------------------------------------------

describe("registerInteraction", () => {
  it("creates the AudioContext exactly once, even across repeated calls", () => {
    const manager = createSoundManager(makeDeps());
    manager.registerInteraction();
    manager.registerInteraction();
    manager.registerInteraction();
    expect(FakeAudioContext.instanceCount).toBe(1);
  });

  it("schedules a resume() after 250ms on the underlying context", () => {
    vi.useFakeTimers();
    const manager = createSoundManager(makeDeps());
    manager.registerInteraction();
    const ctx = manager.ensureContext() as unknown as FakeAudioContext;

    expect(ctx.resume).not.toHaveBeenCalled();
    vi.advanceTimersByTime(250);
    expect(ctx.resume).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// preload
// ---------------------------------------------------------------------------

describe("preload", () => {
  it("fetches every file for every sound type from baseURL and stores rawBuffers", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      statusText: "OK",
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(4)),
    });
    vi.stubGlobal("fetch", fetchMock);

    const manager = createSoundManager(makeDeps());
    await manager.preload();

    expect(fetchMock).toHaveBeenCalledWith(`${manager.baseURL}lift1.mp3`);
    expect(manager.sources.lift.rawBuffers).toHaveLength(3);
    expect(manager.sources.crackle.rawBuffers).toHaveLength(1);
  });

  it("rejects when any file fails to fetch", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, statusText: "Not Found" }));
    const manager = createSoundManager(makeDeps());
    await expect(manager.preload()).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// playSound guards
// ---------------------------------------------------------------------------

function primedManager(deps?: Partial<SoundManagerDeps>) {
  const manager = createSoundManager(makeDeps(deps));
  manager.registerInteraction(); // sets userInteracted = true
  for (const type of Object.keys(manager.sources) as SoundType[]) {
    manager.sources[type].buffers = [{} as AudioBuffer, {} as AudioBuffer];
  }
  const ctx = manager.ensureContext() as unknown as FakeAudioContext;
  return { manager, ctx };
}

describe("playSound", () => {
  it("does nothing when sound is not allowed", () => {
    const { manager, ctx } = primedManager({ getCanPlaySound: () => false });
    manager.playSound("burst");
    expect(ctx.createBufferSource).not.toHaveBeenCalled();
  });

  it("does nothing when the simulation is slowed down below 0.95x", () => {
    const { manager, ctx } = primedManager({ getSimSpeed: () => 0.5 });
    manager.playSound("burst");
    expect(ctx.createBufferSource).not.toHaveBeenCalled();
  });

  it("does nothing before the user has interacted", () => {
    const manager = createSoundManager(makeDeps());
    for (const type of Object.keys(manager.sources) as SoundType[]) {
      manager.sources[type].buffers = [{} as AudioBuffer];
    }
    // No registerInteraction() call.
    expect(() => manager.playSound("burst")).not.toThrow();
  });

  it("throws for an unknown sound type", () => {
    const { manager } = primedManager();
    expect(() => manager.playSound("nonexistent" as SoundType)).toThrow(/Unknown sound type/);
  });

  it("does nothing when the source has no decoded buffers yet", () => {
    const manager = createSoundManager(makeDeps());
    manager.registerInteraction();
    const ctx = manager.ensureContext() as unknown as FakeAudioContext;
    manager.playSound("burst"); // buffers is undefined (preload never ran)
    expect(ctx.createBufferSource).not.toHaveBeenCalled();
  });

  it("throttles rapid burstSmall calls to at most once per 20ms", () => {
    vi.useFakeTimers();
    const { manager, ctx } = primedManager();

    manager.playSound("burstSmall");
    manager.playSound("burstSmall");
    expect(ctx.createBufferSource).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(21);
    manager.playSound("burstSmall");
    expect(ctx.createBufferSource).toHaveBeenCalledTimes(2);
  });

  it("plays a sound: creates and connects a gain node and buffer source, then starts it", () => {
    const { manager, ctx } = primedManager();
    manager.playSound("burst");

    expect(ctx.createGain).toHaveBeenCalledTimes(1);
    expect(ctx.createBufferSource).toHaveBeenCalledTimes(1);
    const bufferSource = ctx.createBufferSource.mock.results[0].value as FakeBufferSource;
    expect(bufferSource.connect).toHaveBeenCalled();
    expect(bufferSource.start).toHaveBeenCalledWith(0);
  });

  it("clamps the scale argument to [0,1] and scales volume accordingly", () => {
    const { manager, ctx } = primedManager();
    manager.playSound("burst", 5); // clamps to 1 -> full configured volume (1)

    const gainNode = ctx.createGain.mock.results[0].value as FakeGainNode;
    expect(gainNode.gain.value).toBeCloseTo(manager.sources.burst.volume);
  });

  it("disconnects bufferSource and gainNode after playback ends", () => {
    const { manager, ctx } = primedManager();
    manager.playSound("burst");

    const bufferSource = ctx.createBufferSource.mock.results[0].value as FakeBufferSource;
    expect(bufferSource.onended).toBeInstanceOf(Function);

    bufferSource.onended!();

    expect(bufferSource.disconnect).toHaveBeenCalledTimes(1);
    const gainNode = ctx.createGain.mock.results[0].value as FakeGainNode;
    expect(gainNode.connect).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// pauseAll / resumeAll
// ---------------------------------------------------------------------------

describe("pauseAll / resumeAll", () => {
  it("pauseAll is a no-op before any AudioContext has been created", () => {
    const manager = createSoundManager(makeDeps());
    expect(() => manager.pauseAll()).not.toThrow();
  });

  it("pauseAll suspends the context once it exists", () => {
    const manager = createSoundManager(makeDeps());
    manager.registerInteraction();
    const ctx = manager.ensureContext() as unknown as FakeAudioContext;

    manager.pauseAll();
    expect(ctx.suspend).toHaveBeenCalledTimes(1);
  });

  it("resumeAll is a no-op before the user has interacted", () => {
    const manager = createSoundManager(makeDeps());
    manager.resumeAll();
    expect(FakeAudioContext.instanceCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// decodeBuffers (triggered via ensureContext when rawBuffers exist)
// ---------------------------------------------------------------------------

describe("decodeBuffers", () => {
  it("decodes rawBuffers into audio buffers when ensureContext is called with preloaded data", async () => {
    const manager = createSoundManager(makeDeps());

    manager.sources.lift.rawBuffers = [new ArrayBuffer(4), new ArrayBuffer(4)];
    manager.sources.burst.rawBuffers = [new ArrayBuffer(4)];

    manager.registerInteraction();

    const ctx = manager.ensureContext() as unknown as FakeAudioContext;

    await new Promise((r) => setTimeout(r, 0));

    expect(ctx.decodeAudioData).toHaveBeenCalledTimes(3);
    expect(manager.sources.lift.buffers).toHaveLength(2);
    expect(manager.sources.burst.buffers).toHaveLength(1);
  });

  it("sets empty buffer arrays when rawBuffers is empty", async () => {
    const manager = createSoundManager(makeDeps());

    manager.sources.lift.rawBuffers = [];

    manager.registerInteraction();
    manager.ensureContext();

    await new Promise((r) => setTimeout(r, 0));

    expect(manager.sources.lift.buffers).toEqual([]);
  });

  it("catches decode errors and sets empty buffer arrays", async () => {
    class FailingDecodeContext extends FakeAudioContext {
      override decodeAudioData = vi.fn(
        (_buf: ArrayBuffer, _resolve: (b: AudioBuffer) => void, reject?: (e: Error) => void) =>
          reject?.(new Error("decode failed")),
      );
    }
    vi.stubGlobal("AudioContext", FailingDecodeContext);

    const manager = createSoundManager(makeDeps());
    manager.sources.lift.rawBuffers = [new ArrayBuffer(4)];

    manager.registerInteraction();
    manager.ensureContext();

    await new Promise((r) => setTimeout(r, 0));

    expect(manager.sources.lift.buffers).toEqual([]);
  });
});
