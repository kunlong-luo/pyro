// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup, screen } from "@testing-library/react";
import { useStore } from "zustand";
import { StoreProvider, useFireworksStore } from "./storeContext";
import { createFireworksStore } from "./fireworksStore";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const testRuntime = {
  isDesktop: true,
  isHeader: false,
  isHighEndDevice: false,
  defaultScaleFactor: 1,
  fullscreen: false,
};

function PausedProbe() {
  const store = useFireworksStore();
  const paused = useStore(store, (s) => s.paused);
  return <div>paused: {String(paused)}</div>;
}

describe("StoreProvider / useFireworksStore", () => {
  it("makes the given store available to descendants via context", () => {
    const store = createFireworksStore(testRuntime);
    store.setState({ paused: true });

    render(
      <StoreProvider store={store}>
        <PausedProbe />
      </StoreProvider>,
    );

    expect(screen.getByText("paused: true")).toBeInTheDocument();
  });

  it("throws when used outside a StoreProvider", () => {
    // React logs the thrown render error to console.error even though we
    // catch it here — silence that expected noise for this one test.
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<PausedProbe />)).toThrow(
      "useFireworksStore must be used within a StoreProvider",
    );
    consoleErrorSpy.mockRestore();
  });
});
