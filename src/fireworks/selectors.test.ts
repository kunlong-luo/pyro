import { describe, it, expect } from "vitest";
import {
  isRunning,
  soundEnabledSelector,
  canPlaySoundSelector,
  qualitySelector,
  shellNameSelector,
  shellSizeSelector,
  finaleSelector,
  skyLightingSelector,
  scaleFactorSelector,
} from "./selectors";
import type { FireworksState } from "@/stores/fireworksStore";

function makeState(overrides: Partial<FireworksState> = {}): FireworksState {
  return {
    paused: false,
    soundEnabled: true,
    menuOpen: false,
    openHelpTopic: null,
    fullscreen: false,
    config: {
      quality: "2",
      shell: "Random",
      size: "3",
      wordShell: false,
      wordShellConfigured: false,
      autoLaunch: true,
      finale: true,
      skyLighting: "1",
      hideControls: false,
      longExposure: false,
      scaleFactor: 1,
    },
    background: { mode: "none", value: "", configured: false },
    ...overrides,
  };
}

describe("isRunning", () => {
  it("is true when neither paused nor the menu is open", () => {
    expect(isRunning(makeState())).toBe(true);
  });

  it("is false while paused", () => {
    expect(isRunning(makeState({ paused: true }))).toBe(false);
  });

  it("is false while the menu is open", () => {
    expect(isRunning(makeState({ menuOpen: true }))).toBe(false);
  });
});

describe("soundEnabledSelector / canPlaySoundSelector", () => {
  it("reflects the raw soundEnabled flag", () => {
    expect(soundEnabledSelector(makeState({ soundEnabled: false }))).toBe(false);
  });

  it("can only play sound when running and sound is enabled", () => {
    expect(canPlaySoundSelector(makeState())).toBe(true);
    expect(canPlaySoundSelector(makeState({ soundEnabled: false }))).toBe(false);
    expect(canPlaySoundSelector(makeState({ paused: true }))).toBe(false);
    expect(canPlaySoundSelector(makeState({ menuOpen: true }))).toBe(false);
  });
});

describe("config selectors", () => {
  it("coerces numeric config fields from their stored string form", () => {
    const state = makeState({
      config: { ...makeState().config, quality: "3", size: "1.2", skyLighting: "0" },
    });
    expect(qualitySelector(state)).toBe(3);
    expect(shellSizeSelector(state)).toBe(1.2);
    expect(skyLightingSelector(state)).toBe(0);
  });

  it("passes through non-numeric config fields as-is", () => {
    const state = makeState({ config: { ...makeState().config, shell: "Ring", finale: false } });
    expect(shellNameSelector(state)).toBe("Ring");
    expect(finaleSelector(state)).toBe(false);
  });

  it("returns the raw scaleFactor number", () => {
    expect(
      scaleFactorSelector(makeState({ config: { ...makeState().config, scaleFactor: 0.75 } })),
    ).toBe(0.75);
  });
});
