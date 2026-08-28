// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { screen, cleanup, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Controls } from "./Controls";
import { renderWithStore } from "./testUtils";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("Controls", () => {
  it("renders as a distinct 'controls hide' class (not a mashed-together token) when hidden", () => {
    const { container } = renderWithStore(<Controls />, { menuOpen: true });
    const root = container.firstElementChild as HTMLElement;
    expect(root.className.split(/\s+/)).toEqual(expect.arrayContaining(["controls", "hide"]));
  });

  it("renders as just 'controls' (no stray 'hide' token) when visible", () => {
    const { container } = renderWithStore(<Controls />, { menuOpen: false });
    const root = container.firstElementChild as HTMLElement;
    expect(root.className.trim()).toBe("controls");
  });

  it("hides when the settings menu is open, and when hideControls is set", () => {
    const { container: menuOpenContainer } = renderWithStore(<Controls />, { menuOpen: true });
    expect((menuOpenContainer.firstElementChild as HTMLElement).className.split(/\s+/)).toContain(
      "hide",
    );

    cleanup();
    const { container: hideControlsContainer, store } = renderWithStore(<Controls />);
    act(() => {
      store.setState((s) => ({ config: { ...s.config, hideControls: true } }));
    });
    expect(
      (hideControlsContainer.firstElementChild as HTMLElement).className.split(/\s+/),
    ).toContain("hide");
  });

  it("toggles paused state on the pause button and swaps its icon", async () => {
    const user = userEvent.setup();
    const { store } = renderWithStore(<Controls />, { paused: false });

    await user.click(screen.getByRole("button", { name: "暂停或继续" }));
    expect(store.getState().paused).toBe(true);

    await user.click(screen.getByRole("button", { name: "暂停或继续" }));
    expect(store.getState().paused).toBe(false);
  });

  it("toggles soundEnabled on the sound button", async () => {
    const user = userEvent.setup();
    const { store } = renderWithStore(<Controls />, { soundEnabled: true });

    await user.click(screen.getByRole("button", { name: "切换声音" }));
    expect(store.getState().soundEnabled).toBe(false);
  });

  it("opens the menu on the settings button", async () => {
    const user = userEvent.setup();
    const { store } = renderWithStore(<Controls />, { menuOpen: false });

    await user.click(screen.getByRole("button", { name: "打开设置" }));
    expect(store.getState().menuOpen).toBe(true);
  });
});
