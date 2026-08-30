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
  it("renders controls container when visible", () => {
    const { container } = renderWithStore(<Controls />, { menuOpen: false });
    const controls = container.querySelector(".controls");
    expect(controls).not.toBeNull();
    expect(controls?.className).not.toContain("hide");
  });

  it("hides controls when menu is open", () => {
    const { container } = renderWithStore(<Controls />, { menuOpen: true });
    const controls = container.querySelector(".controls");
    expect(controls?.className).toContain("hide");
  });

  it("hides controls when hideControls is set", () => {
    const { container, store } = renderWithStore(<Controls />);
    act(() => {
      store.setState((s) => ({ config: { ...s.config, hideControls: true } }));
    });
    const controls = container.querySelector(".controls");
    expect(controls?.className).toContain("hide");
  });

  it("toggles paused state on the pause button", async () => {
    const user = userEvent.setup();
    const { store } = renderWithStore(<Controls />, { paused: false });

    await user.click(screen.getByRole("button", { name: "暂停" }));
    expect(store.getState().paused).toBe(true);

    await user.click(screen.getByRole("button", { name: "继续" }));
    expect(store.getState().paused).toBe(false);
  });

  it("toggles soundEnabled on the sound button", async () => {
    const user = userEvent.setup();
    const { store } = renderWithStore(<Controls />, { soundEnabled: true });

    await user.click(screen.getByRole("button", { name: "静音" }));
    expect(store.getState().soundEnabled).toBe(false);
  });

  it("opens the menu on the settings button", async () => {
    const user = userEvent.setup();
    const { store } = renderWithStore(<Controls />, { menuOpen: false });

    await user.click(screen.getByRole("button", { name: "设置" }));
    expect(store.getState().menuOpen).toBe(true);
  });
});
