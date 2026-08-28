// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
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
