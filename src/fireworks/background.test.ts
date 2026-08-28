// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  getCodeDefaultBackground,
  resolvePreferredBackground,
  applyResolvedBackground,
  type BackgroundManager,
} from "./background";
import type { Background } from "@/stores/fireworksStore";
import { fireworksAppConfig } from "@/config/appConfig";

// The default appConfig has an empty defaultBackground.value, so
// getCodeDefaultBackground() always resolves to "none" in this project as
// shipped — assert that explicitly, since it's the actual current default.
describe("getCodeDefaultBackground", () => {
  it("returns 'none' when appConfig has no default background configured", () => {
    expect(fireworksAppConfig.defaultBackground.value).toBe("");
    expect(getCodeDefaultBackground()).toEqual({ mode: "none", value: "", configured: false });
  });
});

describe("resolvePreferredBackground", () => {
  it("prefers a configured, non-empty user background", () => {
    const userBackground: Background = {
      mode: "image",
      value: "https://x/y.png",
      configured: true,
    };
    const result = resolvePreferredBackground(userBackground);
    expect(result.source).toBe("user");
    expect(result.background).toBe(userBackground);
  });

  it("ignores a background marked configured but with an empty value", () => {
    const empty: Background = { mode: "image", value: "", configured: true };
    const result = resolvePreferredBackground(empty);
    expect(result.source).toBe("none");
  });

  it("falls back to none when there is no user background and no code default", () => {
    const none: Background = { mode: "none", value: "", configured: false };
    const result = resolvePreferredBackground(none);
    expect(result.source).toBe("none");
    expect(result.background).toEqual({ mode: "none", value: "", configured: false });
  });
});

function makeManager() {
  return {
    applyBackground: vi.fn<BackgroundManager["applyBackground"]>(),
    clearBackground: vi.fn<BackgroundManager["clearBackground"]>(),
    setStatus: vi.fn<BackgroundManager["setStatus"]>(),
  };
}

describe("applyResolvedBackground", () => {
  it("clears the background immediately when there is nothing to show", () => {
    const manager = makeManager();
    applyResolvedBackground(manager, { mode: "none", value: "", configured: false });
    expect(manager.clearBackground).toHaveBeenCalledTimes(1);
    expect(manager.applyBackground).not.toHaveBeenCalled();
  });

  it("applies the user background and reports success", async () => {
    const manager = makeManager();
    manager.applyBackground.mockResolvedValue({ ok: true });
    const userBackground: Background = {
      mode: "image",
      value: "https://x/y.png",
      configured: true,
    };

    applyResolvedBackground(manager, userBackground);
    await vi.waitFor(() => expect(manager.setStatus).toHaveBeenCalled());

    expect(manager.applyBackground).toHaveBeenCalledWith(userBackground);
    expect(manager.setStatus).toHaveBeenCalledWith("正在使用网页端背景", "success");
  });

  it("falls back to clearing when the user background fails and there is no code default", async () => {
    const manager = makeManager();
    manager.applyBackground.mockResolvedValue({ ok: false });
    const userBackground: Background = {
      mode: "image",
      value: "https://x/y.png",
      configured: true,
    };

    applyResolvedBackground(manager, userBackground);
    await vi.waitFor(() => expect(manager.clearBackground).toHaveBeenCalled());

    expect(manager.setStatus).toHaveBeenCalledWith("网页端背景无效，当前未显示背景", "error");
  });
});

// The shipped appConfig has an empty defaultBackground.value (see the
// getCodeDefaultBackground describe block above), so the "fall back to /
// use the code default" branches below are unreachable with the real
// config. Mock a non-empty default per test to exercise them directly —
// vi.doMock + a fresh dynamic import keeps the override scoped to just
// that test instead of leaking into the rest of this file.
async function importWithCodeDefaultBackground(value: string) {
  // The top-level static import of "./background" above already cached a
  // module graph built on the real (unmocked) appConfig — clear it so the
  // dynamic import below picks up the mock instead of that cached instance.
  vi.resetModules();
  vi.doMock("@/config/appConfig", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@/config/appConfig")>();
    return {
      ...actual,
      fireworksAppConfig: {
        ...actual.fireworksAppConfig,
        defaultBackground: { mode: "image", value },
      },
    };
  });
  return import("./background");
}

describe("applyResolvedBackground — code-default fallback branches", () => {
  afterEach(() => {
    vi.doUnmock("@/config/appConfig");
    vi.resetModules();
  });

  it("falls back to the code default when the user background fails to apply", async () => {
    const { applyResolvedBackground: applyWithMockedDefault } =
      await importWithCodeDefaultBackground("https://code-default/bg.png");
    const manager = makeManager();
    manager.applyBackground
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: true });
    const userBackground: Background = {
      mode: "image",
      value: "https://x/y.png",
      configured: true,
    };

    applyWithMockedDefault(manager, userBackground);
    await vi.waitFor(() =>
      expect(manager.setStatus).toHaveBeenCalledWith(
        "网页端背景无效，已回退到代码默认背景",
        "idle",
      ),
    );
    expect(manager.applyBackground).toHaveBeenCalledTimes(2);
  });

  it("clears and reports an error when both the user background and the code default fail", async () => {
    const { applyResolvedBackground: applyWithMockedDefault } =
      await importWithCodeDefaultBackground("https://code-default/bg.png");
    const manager = makeManager();
    manager.applyBackground.mockResolvedValue({ ok: false });
    const userBackground: Background = {
      mode: "image",
      value: "https://x/y.png",
      configured: true,
    };

    applyWithMockedDefault(manager, userBackground);
    await vi.waitFor(() =>
      expect(manager.setStatus).toHaveBeenCalledWith("网页端背景和代码默认背景都无效", "error"),
    );
    expect(manager.clearBackground).toHaveBeenCalledTimes(1);
  });

  it("applies the code default directly and reports success when there is no user background", async () => {
    const { applyResolvedBackground: applyWithMockedDefault } =
      await importWithCodeDefaultBackground("https://code-default/bg.png");
    const manager = makeManager();
    manager.applyBackground.mockResolvedValue({ ok: true });

    applyWithMockedDefault(manager, { mode: "none", value: "", configured: false });
    await vi.waitFor(() =>
      expect(manager.setStatus).toHaveBeenCalledWith("正在使用代码默认背景", "idle"),
    );
  });

  it("clears and reports an error when the code default itself fails and there is no user background", async () => {
    const { applyResolvedBackground: applyWithMockedDefault } =
      await importWithCodeDefaultBackground("https://code-default/bg.png");
    const manager = makeManager();
    manager.applyBackground.mockResolvedValue({ ok: false });

    applyWithMockedDefault(manager, { mode: "none", value: "", configured: false });
    await vi.waitFor(() =>
      expect(manager.setStatus).toHaveBeenCalledWith("代码默认背景无效，当前未显示背景", "error"),
    );
    expect(manager.clearBackground).toHaveBeenCalledTimes(1);
  });
});
