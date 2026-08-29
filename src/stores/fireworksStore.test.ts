// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import {
  normalizeBackground,
  normalizeConfig,
  buildDefaultConfig,
  createDefaultState,
  createFireworksStore,
} from "./fireworksStore";
import type { Runtime, FireworksConfig, Background } from "./fireworksStore";

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const defaultRuntime: Runtime = {
  isDesktop: false,
  isHeader: false,
  isHighEndDevice: false,
  defaultScaleFactor: 1.0,
  fullscreen: false,
};

const desktopRuntime: Runtime = {
  ...defaultRuntime,
  isDesktop: true,
  isHighEndDevice: true,
  fullscreen: true,
};

const headerRuntime: Runtime = {
  ...defaultRuntime,
  isHeader: true,
};

const defaultConfig: FireworksConfig = buildDefaultConfig(defaultRuntime);

const storageKey = "cm_fireworks_data";

// ---------------------------------------------------------------------------
// normalizeBackground
// ---------------------------------------------------------------------------

describe("normalizeBackground", () => {
  const fallback: Background = { mode: "none", value: "", configured: false };

  it("returns fallback when rawBackground is not an object", () => {
    expect(normalizeBackground(null, fallback)).toEqual(fallback);
    expect(normalizeBackground(undefined, fallback)).toEqual(fallback);
    expect(normalizeBackground("string", fallback)).toEqual(fallback);
    expect(normalizeBackground(42, fallback)).toEqual(fallback);
  });

  it("returns default when value is empty string", () => {
    expect(normalizeBackground({ mode: "image", value: "" }, fallback)).toEqual({
      mode: "none",
      value: "",
      configured: false,
    });
  });

  it("trims whitespace from value", () => {
    expect(normalizeBackground({ mode: "image", value: "  test.png  " }, fallback)).toEqual({
      mode: "image",
      value: "test.png",
      configured: false,
    });
  });

  it('normalizes mode to "style" or "image"', () => {
    expect(normalizeBackground({ mode: "style", value: "bg.png" }, fallback)).toEqual({
      mode: "style",
      value: "bg.png",
      configured: false,
    });

    expect(normalizeBackground({ mode: "invalid", value: "bg.png" }, fallback)).toEqual({
      mode: "image",
      value: "bg.png",
      configured: false,
    });
  });

  it("respects configured boolean", () => {
    expect(
      normalizeBackground({ mode: "image", value: "bg.png", configured: true }, fallback),
    ).toEqual({ mode: "image", value: "bg.png", configured: true });
  });

  it("uses inferConfiguredFromValue when configured is missing", () => {
    expect(normalizeBackground({ mode: "image", value: "bg.png" }, fallback, true)).toEqual({
      mode: "image",
      value: "bg.png",
      configured: true,
    });

    expect(normalizeBackground({ mode: "image", value: "bg.png" }, fallback, false)).toEqual({
      mode: "image",
      value: "bg.png",
      configured: false,
    });
  });

  it("returns default object when fallbackBackground is null", () => {
    expect(normalizeBackground(null, null)).toEqual({
      mode: "none",
      value: "",
      configured: false,
    });
  });
});

// ---------------------------------------------------------------------------
// normalizeConfig
// ---------------------------------------------------------------------------

describe("normalizeConfig", () => {
  it("returns defaults when rawConfig is not an object", () => {
    expect(normalizeConfig(null, defaultConfig)).toEqual(defaultConfig);
    expect(normalizeConfig(undefined, defaultConfig)).toEqual(defaultConfig);
    expect(normalizeConfig("string", defaultConfig)).toEqual(defaultConfig);
  });

  it("normalizes valid config values", () => {
    const raw = {
      quality: "3",
      shell: "Rocket",
      size: "4",
      wordShell: true,
      wordShellConfigured: true,
      autoLaunch: false,
      finale: false,
      skyLighting: "0",
      hideControls: true,
      longExposure: true,
      scaleFactor: 0.75,
    };
    const result = normalizeConfig(raw, defaultConfig);
    expect(result.quality).toBe("3");
    expect(result.shell).toBe("Rocket");
    expect(result.size).toBe("4");
    expect(result.wordShell).toBe(true);
    expect(result.wordShellConfigured).toBe(true);
    expect(result.autoLaunch).toBe(false);
    expect(result.finale).toBe(false);
    expect(result.skyLighting).toBe("0");
    expect(result.hideControls).toBe(true);
    expect(result.longExposure).toBe(true);
    expect(result.scaleFactor).toBe(0.75);
  });

  it("falls back to defaults for invalid quality values", () => {
    expect(normalizeConfig({ quality: "999" }, defaultConfig).quality).toBe(defaultConfig.quality);
  });

  it("falls back to defaults for invalid shellSize values", () => {
    expect(normalizeConfig({ size: "99" }, defaultConfig).size).toBe(defaultConfig.size);
  });

  it("accepts all valid shellSize values (0-5)", () => {
    for (const s of ["0", "1", "2", "3", "4", "5"]) {
      expect(normalizeConfig({ size: s }, defaultConfig).size).toBe(s);
    }
  });

  it("normalizes scaleFactor to nearest valid value or falls back", () => {
    expect(normalizeConfig({ scaleFactor: 1.0 }, defaultConfig).scaleFactor).toBe(1.0);
    expect(normalizeConfig({ scaleFactor: 0.75 }, defaultConfig).scaleFactor).toBe(0.75);
    expect(normalizeConfig({ scaleFactor: 999 }, defaultConfig).scaleFactor).toBe(
      defaultConfig.scaleFactor,
    );
    expect(normalizeConfig({ scaleFactor: "invalid" }, defaultConfig).scaleFactor).toBe(
      defaultConfig.scaleFactor,
    );
  });
});

// ---------------------------------------------------------------------------
// buildDefaultConfig
// ---------------------------------------------------------------------------

describe("buildDefaultConfig", () => {
  it('uses size "2" for mobile', () => {
    const config = buildDefaultConfig(defaultRuntime);
    expect(config.size).toBe("2");
  });

  it('uses size "3" for desktop', () => {
    const config = buildDefaultConfig(desktopRuntime);
    expect(config.size).toBe("3");
  });

  it('uses size "1.2" for header', () => {
    const config = buildDefaultConfig(headerRuntime);
    expect(config.size).toBe("1.2");
  });

  it("uses high quality for high-end devices", () => {
    expect(buildDefaultConfig(desktopRuntime).quality).toBe("3");
  });

  it("uses normal quality for non-high-end devices", () => {
    expect(buildDefaultConfig(defaultRuntime).quality).toBe("2");
  });

  it("sets wordShell and wordShellConfigured to false", () => {
    const config = buildDefaultConfig(defaultRuntime);
    expect(config.wordShell).toBe(false);
    expect(config.wordShellConfigured).toBe(false);
  });

  it("sets hideControls to true for header runtime", () => {
    expect(buildDefaultConfig(headerRuntime).hideControls).toBe(true);
  });

  it("sets hideControls to false for non-header runtime", () => {
    expect(buildDefaultConfig(defaultRuntime).hideControls).toBe(false);
  });

  it("uses the provided defaultScaleFactor", () => {
    expect(buildDefaultConfig({ ...defaultRuntime, defaultScaleFactor: 1.5 }).scaleFactor).toBe(
      1.5,
    );
  });
});

// ---------------------------------------------------------------------------
// createDefaultState
// ---------------------------------------------------------------------------

describe("createDefaultState", () => {
  it("produces correct initial state shape", () => {
    const state = createDefaultState(defaultRuntime);
    expect(state.paused).toBe(true);
    expect(state.soundEnabled).toBe(true);
    expect(state.menuOpen).toBe(false);
    expect(state.openHelpTopic).toBeNull();
    expect(state.fullscreen).toBe(false);
    expect(state.config).toEqual(buildDefaultConfig(defaultRuntime));
    expect(state.background).toEqual({
      mode: "none",
      value: "",
      configured: false,
    });
  });

  it("sets fullscreen from runtime", () => {
    expect(createDefaultState(desktopRuntime).fullscreen).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// createFireworksStore – schema migration
// ---------------------------------------------------------------------------

describe("createFireworksStore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("creates store with default state when localStorage is empty", () => {
    const store = createFireworksStore(defaultRuntime);
    const state = store.getState();
    expect(state.paused).toBe(true);
    expect(state.config).toEqual(buildDefaultConfig(defaultRuntime));
    expect(state.background).toEqual({
      mode: "none",
      value: "",
      configured: false,
    });
  });

  it("loads from current schema version (1.0)", () => {
    const config: FireworksConfig = {
      ...defaultConfig,
      quality: "3",
      size: "4",
    };
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        schemaVersion: "1.0",
        data: { config, background: { mode: "image", value: "test.png", configured: true } },
      }),
    );

    const store = createFireworksStore(defaultRuntime);
    const state = store.getState();
    expect(state.config.quality).toBe("3");
    expect(state.config.size).toBe("4");
    expect(state.background.mode).toBe("image");
    expect(state.background.value).toBe("test.png");
    expect(state.background.configured).toBe(true);
  });

  it("migrates schema 2.0/2.1 with wordShell reset", () => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        schemaVersion: "2.1",
        data: {
          config: { ...defaultConfig, wordShell: true, wordShellConfigured: true },
          background: { mode: "image", value: "bg.jpg" },
        },
      }),
    );

    const store = createFireworksStore(defaultRuntime);
    const state = store.getState();
    expect(state.config.wordShell).toBe(false);
    expect(state.config.wordShellConfigured).toBe(false);
    // background with inferConfiguredFromValue = true → configured should be true since value is non-empty
    expect(state.background.configured).toBe(true);
  });

  it("migrates schema 1.1/1.2 (data is config directly)", () => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        schemaVersion: "1.2",
        data: { ...defaultConfig, quality: "1", size: "5" },
      }),
    );

    const store = createFireworksStore(defaultRuntime);
    const state = store.getState();
    expect(state.config.quality).toBe("1");
    expect(state.config.size).toBe("5");
    expect(state.config.wordShell).toBe(false);
    expect(state.config.wordShellConfigured).toBe(false);
    // background should be default (not from stored)
    expect(state.background).toEqual({
      mode: "none",
      value: "",
      configured: false,
    });
  });

  it("applies legacy migration when legacyStorageKey=1", () => {
    localStorage.setItem("schemaVersion", "1");
    localStorage.setItem("configSize", JSON.stringify(4));

    const store = createFireworksStore(defaultRuntime);
    const state = store.getState();
    expect(state.config.size).toBe("4");
  });

  it("ignores invalid legacy configSize", () => {
    localStorage.setItem("schemaVersion", "1");
    localStorage.setItem("configSize", JSON.stringify("invalid"));

    const store = createFireworksStore(defaultRuntime);
    const state = store.getState();
    // parseInt('invalid') → NaN → String(NaN) → 'NaN' → not in shellSizeValues → default
    expect(state.config.size).toBe(defaultConfig.size);
  });

  it("falls through to legacy migration when schemaVersion is unknown", () => {
    localStorage.setItem(storageKey, JSON.stringify({ schemaVersion: "9.9", data: {} }));
    localStorage.setItem("schemaVersion", "1");
    localStorage.setItem("configSize", JSON.stringify(3));

    const store = createFireworksStore(defaultRuntime);
    expect(store.getState().config.size).toBe("3");
  });

  it("removes configSize from localStorage when legacy JSON.parse fails", () => {
    localStorage.setItem(storageKey, JSON.stringify({ schemaVersion: "9.9", data: {} }));
    localStorage.setItem("schemaVersion", "1");
    localStorage.setItem("configSize", "NOT_VALID_JSON");

    const store = createFireworksStore(defaultRuntime);
    expect(store.getState().config.size).toBe(defaultConfig.size);
    expect(localStorage.getItem("configSize")).toBeNull();
  });

  it("handles corrupt localStorage data gracefully", () => {
    localStorage.setItem(storageKey, "NOT_JSON");

    const store = createFireworksStore(defaultRuntime);
    const state = store.getState();
    // Falls back to legacy migration, then defaults
    expect(state.config).toEqual(defaultConfig);
  });

  it("handles malformed storage structure gracefully", () => {
    localStorage.setItem(storageKey, JSON.stringify({ noData: true }));

    const store = createFireworksStore(defaultRuntime);
    const state = store.getState();
    expect(state.config).toEqual(defaultConfig);
  });

  it("persists config and background on setState", () => {
    const store = createFireworksStore(defaultRuntime);
    store.setState({ paused: false });

    const raw = localStorage.getItem(storageKey);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.schemaVersion).toBe("1.0");
    expect(parsed.data).toHaveProperty("config");
    expect(parsed.data).toHaveProperty("background");
    // paused is NOT persisted (partialized away)
    expect(parsed.data).not.toHaveProperty("paused");
  });

  it("subscribe fires on state changes", () => {
    const store = createFireworksStore(defaultRuntime);
    let received: ReturnType<typeof store.getState> | null = null;
    const unsub = store.subscribe((s) => {
      received = s;
    });

    store.setState({ paused: false });
    expect(received!.paused).toBe(false);

    unsub();
    store.setState({ paused: true });
    // After unsubscribe, received should still be the old value
    expect(received!.paused).toBe(false);
  });

  it("scaleFactor is validated on load", () => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        schemaVersion: "1.0",
        data: {
          config: { ...defaultConfig, scaleFactor: 999 },
          background: { mode: "none", value: "", configured: false },
        },
      }),
    );

    const store = createFireworksStore(defaultRuntime);
    expect(store.getState().config.scaleFactor).toBe(defaultConfig.scaleFactor);
  });

  it("valid scaleFactor is preserved on load", () => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        schemaVersion: "1.0",
        data: {
          config: { ...defaultConfig, scaleFactor: 1.5 },
          background: { mode: "none", value: "", configured: false },
        },
      }),
    );

    const store = createFireworksStore(defaultRuntime);
    expect(store.getState().config.scaleFactor).toBe(1.5);
  });
});
