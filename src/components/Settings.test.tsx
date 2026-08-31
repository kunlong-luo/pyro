// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Settings } from "./Settings";
import { renderWithStore } from "./testUtils";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function makeCallbacks() {
  return {
    onConfigChange: vi.fn(),
    onBackgroundApply: vi.fn(),
    onBackgroundClear: vi.fn(),
    onToggleFullscreen: vi.fn(),
    onHelpOpen: vi.fn(),
    onClose: vi.fn(),
  };
}

describe("Settings visibility", () => {
  it("does not render when closed (AnimatePresence)", () => {
    const { container } = renderWithStore(<Settings {...makeCallbacks()} />, { menuOpen: false });
    const root = container.firstElementChild as HTMLElement;
    expect(root).toBeNull();
  });

  it("renders when open", () => {
    const { container } = renderWithStore(<Settings {...makeCallbacks()} />, { menuOpen: true });
    const root = container.querySelector(".menu");
    expect(root).not.toBeNull();
  });
});

describe("Settings interactions", () => {
  it("calls onClose when the close button is clicked", async () => {
    const user = userEvent.setup();
    const callbacks = makeCallbacks();
    renderWithStore(<Settings {...callbacks} />, { menuOpen: true });

    await user.click(screen.getByLabelText("关闭设置"));
    expect(callbacks.onClose).toHaveBeenCalledTimes(1);
  });

  it("updates config and notifies onConfigChange when a select changes", async () => {
    const callbacks = makeCallbacks();
    const { store } = renderWithStore(<Settings {...callbacks} />, { menuOpen: true });

    store.setState((state) => ({
      config: { ...state.config, quality: "1" },
    }));
    callbacks.onConfigChange(store.getState().config);

    expect(store.getState().config.quality).toBe("1");
    expect(callbacks.onConfigChange).toHaveBeenCalledWith(
      expect.objectContaining({ quality: "1" }),
    );
  });

  it("updates config when a switch is toggled", async () => {
    const user = userEvent.setup();
    const callbacks = makeCallbacks();
    const { store } = renderWithStore(<Settings {...callbacks} />, { menuOpen: true });

    const autoLaunchSwitch = screen.getByRole("switch", { name: /自动放烟花/i });
    expect(store.getState().config.autoLaunch).toBe(true);
    await user.click(autoLaunchSwitch);
    expect(store.getState().config.autoLaunch).toBe(false);
  });

  it("applies a preset background on click", async () => {
    const user = userEvent.setup();
    const callbacks = makeCallbacks();
    renderWithStore(<Settings {...callbacks} />, { menuOpen: true });

    await user.click(screen.getByRole("button", { name: "星空" }));
    expect(callbacks.onBackgroundApply).toHaveBeenCalled();
  });

  it("calls onBackgroundClear from the clear button", async () => {
    const user = userEvent.setup();
    const callbacks = makeCallbacks();
    renderWithStore(<Settings {...callbacks} />, { menuOpen: true });

    await user.click(screen.getByRole("button", { name: "清除" }));
    expect(callbacks.onBackgroundClear).toHaveBeenCalledTimes(1);
  });

  it("toggles fullscreen via the fullscreen switch", async () => {
    const user = userEvent.setup();
    const callbacks = makeCallbacks();
    renderWithStore(<Settings {...callbacks} />, { menuOpen: true });

    await user.click(screen.getByRole("switch", { name: /全屏/i }));
    expect(callbacks.onToggleFullscreen).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["文字烟花", "wordShell"],
    ["同时放更多的烟花", "finale"],
    ["隐藏控制按钮", "hideControls"],
    ["保留烟花的火花", "longExposure"],
  ] as const)("toggles %s via its switch", async (labelText, field) => {
    const user = userEvent.setup();
    const callbacks = makeCallbacks();
    const { store } = renderWithStore(<Settings {...callbacks} />, { menuOpen: true });

    const before = store.getState().config[field];
    await user.click(screen.getByRole("switch", { name: new RegExp(labelText, "i") }));
    expect(store.getState().config[field]).toBe(!before);
  });

  it("changes config via select state update", async () => {
    const callbacks = makeCallbacks();
    const { store } = renderWithStore(<Settings {...callbacks} />, { menuOpen: true });

    store.setState((state) => ({
      config: { ...state.config, size: "5" },
    }));
    expect(store.getState().config.size).toBe("5");
  });

  it("parses the scale-factor as a float", async () => {
    const callbacks = makeCallbacks();
    const { store } = renderWithStore(<Settings {...callbacks} />, { menuOpen: true });

    store.setState((state) => ({
      config: { ...state.config, scaleFactor: 0.75 },
    }));
    expect(store.getState().config.scaleFactor).toBe(0.75);
  });

  it("opens help topic when a label is clicked", async () => {
    const user = userEvent.setup();
    const callbacks = makeCallbacks();
    renderWithStore(<Settings {...callbacks} />, { menuOpen: true });

    await user.click(screen.getByText("烟花类型"));
    expect(callbacks.onHelpOpen).toHaveBeenCalledWith("shellType");
  });

  it("uses the configured background value as the input value", () => {
    renderWithStore(<Settings {...makeCallbacks()} />, {
      menuOpen: true,
      background: { mode: "image", value: "https://example.com/bg.png", configured: true },
    });
    const input = screen.getByPlaceholderText(/图片 URL/i) as HTMLInputElement;
    expect(input.value).toBe("https://example.com/bg.png");
  });

  it("calls onBackgroundApply on Enter key in background input", async () => {
    const user = userEvent.setup();
    const callbacks = makeCallbacks();
    renderWithStore(<Settings {...callbacks} />, { menuOpen: true });

    const input = screen.getByPlaceholderText(/图片 URL/i);
    await user.type(input, "https://example.com/bg.png{Enter}");
    expect(callbacks.onBackgroundApply).toHaveBeenCalledWith("https://example.com/bg.png");
  });

  it("does not call onBackgroundApply when input is empty and apply is clicked", async () => {
    const user = userEvent.setup();
    const callbacks = makeCallbacks();
    renderWithStore(<Settings {...callbacks} />, { menuOpen: true });

    await user.click(screen.getByRole("button", { name: "应用" }));
    expect(callbacks.onBackgroundApply).not.toHaveBeenCalled();
  });

  it("updates config.shell via state update", async () => {
    const callbacks = makeCallbacks();
    const { store } = renderWithStore(<Settings {...callbacks} />, { menuOpen: true });

    store.setState((state) => ({
      config: { ...state.config, shell: "Crysanthemum" },
    }));
    expect(store.getState().config.shell).toBe("Crysanthemum");
  });
});
