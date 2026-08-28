// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createBackgroundManager } from "./backgroundManager";

function makeResponse(ok: boolean, contentType = "image/png"): Response {
  return {
    ok,
    statusText: "error",
    headers: { get: () => contentType },
  } as unknown as Response;
}

describe("createBackgroundManager", () => {
  let container: HTMLElement;
  let onStatusChange: ReturnType<typeof vi.fn<(msg: string, state: string) => void>>;

  beforeEach(() => {
    container = document.createElement("div");
    onStatusChange = vi.fn<(msg: string, state: string) => void>();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("clearBackground", () => {
    it("resets all background styles and reports idle status", () => {
      container.style.backgroundImage = "url(x.png)";
      const manager = createBackgroundManager({ container, onStatusChange });

      const result = manager.clearBackground();

      expect(container.style.backgroundImage).toBe("");
      expect(onStatusChange).toHaveBeenCalledWith("未设置自定义背景", "idle");
      expect(result).toEqual({ mode: "none", value: "" });
    });
  });

  describe("applyBackground", () => {
    it("clears the background for an empty/whitespace value", async () => {
      const manager = createBackgroundManager({ container, onStatusChange });
      const result = await manager.applyBackground("   ");
      expect(result.ok).toBe(true);
      expect(result.settings).toEqual({ mode: "none", value: "" });
    });

    it("applies a same-origin url(...) background after successfully preloading it", async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeResponse(true, "image/png"));
      vi.stubGlobal("fetch", fetchMock);
      const manager = createBackgroundManager({ container, onStatusChange });

      const result = await manager.applyBackground("url(foo.png)");

      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("foo.png"), {
        cache: "no-store",
      });
      expect(result.ok).toBe(true);
      expect(result.settings?.mode).toBe("image");
      expect(container.style.backgroundImage).toContain("foo.png");
      expect(onStatusChange).toHaveBeenCalledWith("自定义背景已应用", "success");
    });

    it("treats a bare value with no CSS function as an image URL too", async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeResponse(true, "image/png"));
      vi.stubGlobal("fetch", fetchMock);
      const manager = createBackgroundManager({ container, onStatusChange });

      const result = await manager.applyBackground("photo.jpg");

      expect(result.ok).toBe(true);
      expect(result.settings?.mode).toBe("image");
      expect(container.style.backgroundImage).toContain("photo.jpg");
    });

    it("applies a gradient/style value without touching fetch at all", async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);
      const manager = createBackgroundManager({ container, onStatusChange });

      const result = await manager.applyBackground("linear-gradient(red, blue)");

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.ok).toBe(true);
      expect(result.settings?.mode).toBe("style");
      expect(container.style.backgroundImage).toContain("linear-gradient");
    });

    it("fails and reports an error when the same-origin fetch is not ok", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeResponse(false)));
      const manager = createBackgroundManager({ container, onStatusChange });

      const result = await manager.applyBackground("url(missing.png)");

      expect(result.ok).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
      expect(onStatusChange).toHaveBeenCalledWith("背景加载失败，请检查地址或样式", "error");
    });

    it("fails when the response is ok but not an image content-type", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeResponse(true, "text/html")));
      const manager = createBackgroundManager({ container, onStatusChange });

      const result = await manager.applyBackground("url(not-an-image.html)");

      expect(result.ok).toBe(false);
    });

    it("preloads a cross-origin URL via Image() instead of fetch", async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);
      class FakeImage {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        set src(_value: string) {
          queueMicrotask(() => this.onload?.());
        }
      }
      vi.stubGlobal("Image", FakeImage);
      const manager = createBackgroundManager({ container, onStatusChange });

      const result = await manager.applyBackground("url(https://other-origin.example/x.png)");

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.ok).toBe(true);
    });

    it("cancels the earlier request when a newer one supersedes it", async () => {
      let resolveFirst: (() => void) | undefined;
      const fetchMock = vi
        .fn()
        .mockImplementationOnce(
          () =>
            new Promise((resolve) => {
              resolveFirst = () => resolve(makeResponse(true, "image/png"));
            }),
        )
        .mockResolvedValueOnce(makeResponse(true, "image/png"));
      vi.stubGlobal("fetch", fetchMock);
      const manager = createBackgroundManager({ container, onStatusChange });

      const firstCall = manager.applyBackground("url(first.png)");
      const secondCall = manager.applyBackground("url(second.png)");
      resolveFirst?.();

      const [firstResult, secondResult] = await Promise.all([firstCall, secondCall]);

      expect(firstResult).toEqual({ ok: false, cancelled: true });
      expect(secondResult.ok).toBe(true);
      expect(container.style.backgroundImage).toContain("second.png");
    });
  });
});
