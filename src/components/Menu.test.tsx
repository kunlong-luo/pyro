// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Menu } from "./Menu";
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

describe("Menu visibility class", () => {
  it("carries a distinct 'hide' token (not mashed into 'menuhide') when closed", () => {
    const { container } = renderWithStore(<Menu {...makeCallbacks()} />, { menuOpen: false });
    const root = container.firstElementChild as HTMLElement;
    expect(root.className.split(/\s+/)).toEqual(expect.arrayContaining(["menu", "hide"]));
  });

  it("has just the 'menu' class (no stray 'hide') when open", () => {
    const { container } = renderWithStore(<Menu {...makeCallbacks()} />, { menuOpen: true });
    const root = container.firstElementChild as HTMLElement;
    expect(root.className.trim()).toBe("menu");
  });
});

describe("Menu interactions", () => {
  it("calls onClose when the close button is clicked", async () => {
    const user = userEvent.setup();
    const callbacks = makeCallbacks();
    renderWithStore(<Menu {...callbacks} />, { menuOpen: true });

    await user.click(document.querySelector(".close-menu-btn")!);
    expect(callbacks.onClose).toHaveBeenCalledTimes(1);
  });

  it("updates config and notifies onConfigChange when a select changes", async () => {
    const user = userEvent.setup();
    const callbacks = makeCallbacks();
    const { store } = renderWithStore(<Menu {...callbacks} />, { menuOpen: true });

    const qualitySelect = document.querySelector<HTMLSelectElement>(".quality-ui")!;
    await user.selectOptions(qualitySelect, "1"); // "低"

    expect(store.getState().config.quality).toBe("1");
    expect(callbacks.onConfigChange).toHaveBeenCalledWith(
      expect.objectContaining({ quality: "1" }),
    );
  });

  it("updates config when a checkbox is toggled", async () => {
    const user = userEvent.setup();
    const callbacks = makeCallbacks();
    const { store } = renderWithStore(<Menu {...callbacks} />, { menuOpen: true });

    const autoLaunchCheckbox = document.querySelector<HTMLInputElement>(".auto-launch")!;
    expect(store.getState().config.autoLaunch).toBe(true);
    await user.click(autoLaunchCheckbox);
    expect(store.getState().config.autoLaunch).toBe(false);
  });

  it("applies the background input value via the apply button", async () => {
    const user = userEvent.setup();
    const callbacks = makeCallbacks();
    renderWithStore(<Menu {...callbacks} />, { menuOpen: true });

    const input = document.querySelector<HTMLInputElement>(".background-input")!;
    await user.type(input, "https://example.com/bg.png");
    await user.click(document.querySelector(".background-apply-btn")!);

    expect(callbacks.onBackgroundApply).toHaveBeenCalledWith("https://example.com/bg.png");
  });

  it("applies the background input value on Enter", async () => {
    const user = userEvent.setup();
    const callbacks = makeCallbacks();
    renderWithStore(<Menu {...callbacks} />, { menuOpen: true });

    const input = document.querySelector<HTMLInputElement>(".background-input")!;
    await user.type(input, "https://example.com/bg.png{Enter}");

    expect(callbacks.onBackgroundApply).toHaveBeenCalledWith("https://example.com/bg.png");
  });

  it("calls onBackgroundClear from the clear button", async () => {
    const user = userEvent.setup();
    const callbacks = makeCallbacks();
    renderWithStore(<Menu {...callbacks} />, { menuOpen: true });

    await user.click(document.querySelector(".background-clear-btn")!);
    expect(callbacks.onBackgroundClear).toHaveBeenCalledTimes(1);
  });

  it("opens the matching help topic when a label is clicked", async () => {
    const user = userEvent.setup();
    const callbacks = makeCallbacks();
    renderWithStore(<Menu {...callbacks} />, { menuOpen: true });

    await user.click(document.querySelector(".shell-type-label")!);
    expect(callbacks.onHelpOpen).toHaveBeenCalledWith("shellType");
  });

  it("toggles fullscreen via the fullscreen checkbox", async () => {
    const user = userEvent.setup();
    const callbacks = makeCallbacks();
    renderWithStore(<Menu {...callbacks} />, { menuOpen: true });

    await user.click(screen.getByLabelText("全屏"));
    expect(callbacks.onToggleFullscreen).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["文字烟花", "wordShell"],
    ["同时放更多的烟花", "finale"],
    ["隐藏控制按钮", "hideControls"],
    ["保留烟花的火花", "longExposure"],
  ] as const)("toggles %s via its label-associated checkbox", async (labelText, field) => {
    const user = userEvent.setup();
    const callbacks = makeCallbacks();
    const { store } = renderWithStore(<Menu {...callbacks} />, { menuOpen: true });

    const before = store.getState().config[field];
    await user.click(screen.getByLabelText(labelText));
    expect(store.getState().config[field]).toBe(!before);
  });

  it.each([
    ["烟花大小", "size", "5"],
    ["照亮天空", "skyLighting", "0"],
  ] as const)(
    "changes config via the %s select (found by its associated label)",
    async (labelText, field, optionValue) => {
      const user = userEvent.setup();
      const callbacks = makeCallbacks();
      const { store } = renderWithStore(<Menu {...callbacks} />, { menuOpen: true });

      await user.selectOptions(screen.getByLabelText(labelText), optionValue);
      expect(store.getState().config[field as "size" | "skyLighting"]).toBe(optionValue);
    },
  );

  it("parses the scale-factor select's option value as a float, not a raw string", async () => {
    const user = userEvent.setup();
    const callbacks = makeCallbacks();
    const { store } = renderWithStore(<Menu {...callbacks} />, { menuOpen: true });

    await user.selectOptions(screen.getByLabelText("缩放"), "0.75");
    expect(store.getState().config.scaleFactor).toBe(0.75);
  });
});
