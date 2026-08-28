// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { createWordBurstTracker } from "./wordBurst";
import { fireworksAppConfig } from "@/config/appConfig";

describe("createWordBurstTracker", () => {
  it("forces a burst on the very first eligible shell", () => {
    const tracker = createWordBurstTracker();
    expect(tracker.shouldCreateBurst({ comet: true }, true)).toBe(true);
  });

  it("never bursts when word shells are disabled", () => {
    const tracker = createWordBurstTracker();
    expect(tracker.shouldCreateBurst({ comet: true }, false)).toBe(false);
  });

  it("never bursts for a shell with disableWord set", () => {
    const tracker = createWordBurstTracker();
    expect(tracker.shouldCreateBurst({ comet: true, disableWord: true }, true)).toBe(false);
  });

  it("never bursts for a shell with no comet (sub-shells)", () => {
    const tracker = createWordBurstTracker();
    expect(tracker.shouldCreateBurst({ comet: false }, true)).toBe(false);
  });

  it("resets the counter after a burst, then requires wordBurstInterval more shells", () => {
    const tracker = createWordBurstTracker();
    tracker.shouldCreateBurst({ comet: true }, true); // consumes the initial force

    for (let i = 0; i < fireworksAppConfig.wordBurstInterval - 1; i += 1) {
      expect(tracker.shouldCreateBurst({ comet: true }, true)).toBe(false);
    }
    expect(tracker.shouldCreateBurst({ comet: true }, true)).toBe(true);
  });

  it("forceWordBurst on the shell always triggers, regardless of the counter", () => {
    const tracker = createWordBurstTracker();
    tracker.shouldCreateBurst({ comet: true }, true); // consume initial force
    expect(tracker.shouldCreateBurst({ comet: true, forceWordBurst: true }, true)).toBe(true);
  });

  it("queueBurst() forces the next eligible shell to burst", () => {
    const tracker = createWordBurstTracker();
    tracker.shouldCreateBurst({ comet: true }, true); // consume initial force
    expect(tracker.shouldCreateBurst({ comet: true }, true)).toBe(false);

    tracker.queueBurst();
    expect(tracker.shouldCreateBurst({ comet: true }, true)).toBe(true);
  });

  it("reset() clears both the counter and the force flag", () => {
    const tracker = createWordBurstTracker();
    tracker.queueBurst();
    tracker.reset();
    expect(tracker.forceNextBurst).toBe(false);
    expect(tracker.shellsSinceLastBurst).toBe(0);
  });

  it("does not advance the counter for ineligible shells", () => {
    const tracker = createWordBurstTracker();
    tracker.shouldCreateBurst({ comet: true }, true); // consume initial force

    // These should not count toward the interval at all.
    tracker.shouldCreateBurst({ comet: false }, true);
    tracker.shouldCreateBurst({ comet: true, disableWord: true }, true);
    tracker.shouldCreateBurst({ comet: true }, false);

    expect(tracker.shellsSinceLastBurst).toBe(0);
  });
});
