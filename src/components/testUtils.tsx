// Shared render helper for component tests — not itself a test file.
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import type { StoreApi } from "zustand";
import { StoreContext } from "@/stores/storeContext";
import { createFireworksStore } from "@/stores/fireworksStore";
import type { FireworksState, Runtime } from "@/stores/fireworksStore";

const testRuntime: Runtime = {
  isDesktop: true,
  isHeader: false,
  isHighEndDevice: false,
  defaultScaleFactor: 1,
  fullscreen: false,
};

export function makeTestStore(overrides: Partial<FireworksState> = {}): StoreApi<FireworksState> {
  const store = createFireworksStore(testRuntime);
  if (Object.keys(overrides).length > 0) {
    store.setState(overrides);
  }
  return store;
}

export function renderWithStore(ui: ReactElement, overrides: Partial<FireworksState> = {}) {
  const store = makeTestStore(overrides);
  const utils = render(<StoreContext.Provider value={store}>{ui}</StoreContext.Provider>);
  return { store, ...utils };
}
