"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { StoreApi } from "zustand";
import type { FireworksState } from "./fireworksStore";

/**
 * Store context for Zustand store.
 * Provides access to the Zustand store API (getState, setState, subscribe)
 * throughout the component tree.
 */
export type FireworksStoreApi = StoreApi<FireworksState>;

export const StoreContext = createContext<StoreApi<FireworksState> | null>(null);

/**
 * Provider component that wraps the app with the Zustand store.
 * Must be a client component because it uses React Context.
 */
export function StoreProvider({ children, store }: { children: ReactNode; store: StoreApi<FireworksState> }) {
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useFireworksStore(): StoreApi<FireworksState> {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error("useFireworksStore must be used within a StoreProvider");
  }
  return store;
}