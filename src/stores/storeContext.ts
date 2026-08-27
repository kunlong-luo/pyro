import { createContext, useContext } from "react";
import type { StoreApi } from "zustand";
import type { FireworksState } from "./fireworksStore";

export const StoreContext = createContext<StoreApi<FireworksState> | null>(
  null,
);

export function useFireworksStore(): StoreApi<FireworksState> {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error(
      "useFireworksStore must be used within a StoreContext.Provider",
    );
  }
  return store;
}
