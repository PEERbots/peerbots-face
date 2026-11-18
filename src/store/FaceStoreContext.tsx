import { createContext, useContext, useState, type ReactNode } from "react";
import { useStore } from "zustand";
import {
  createPeerbotsFaceStore,
  globalFaceStore,
  type CreatePeerbotsFaceStoreOptions,
  type PeerbotsFaceStore,
  type PeerbotsFaceStoreApi,
} from "./createPeerbotsFaceStore";

export const FaceStoreContext = createContext<PeerbotsFaceStoreApi | null>(null);

export interface FaceStoreProviderProps {
  children: ReactNode;
  store?: PeerbotsFaceStoreApi;
  options?: CreatePeerbotsFaceStoreOptions;
}

export function FaceStoreProvider({
  children,
  store,
  options,
}: FaceStoreProviderProps) {
  const [internalStore] = useState<PeerbotsFaceStoreApi>(() =>
    store ?? createPeerbotsFaceStore(options),
  );
  const resolvedStore = store ?? internalStore;

  return (
    <FaceStoreContext.Provider value={resolvedStore}>
      {children}
    </FaceStoreContext.Provider>
  );
}

let activeGlobalFaceStore: PeerbotsFaceStoreApi = globalFaceStore;

/**
 * Configures the fallback global face store used when `useFaceStore` or `useFaceStoreInstance`
 * is invoked outside a `<FaceStoreProvider>` tree (or via `useFaceStore.getState()`).
 */
export function setGlobalFaceStore(store: PeerbotsFaceStoreApi): void {
  activeGlobalFaceStore = store;
}

/**
 * Returns the currently configured fallback global face store.
 */
export function getGlobalFaceStore(): PeerbotsFaceStoreApi {
  return activeGlobalFaceStore;
}

export function useFaceStoreInstance(): PeerbotsFaceStoreApi {
  const context = useContext(FaceStoreContext);
  return context ?? activeGlobalFaceStore;
}

export interface UseFaceStoreHook {
  <T>(selector: (state: PeerbotsFaceStore) => T): T;
  getState: () => PeerbotsFaceStore;
  setState: PeerbotsFaceStoreApi["setState"];
  subscribe: PeerbotsFaceStoreApi["subscribe"];
}

function useFaceStoreBase<T>(selector: (state: PeerbotsFaceStore) => T): T {
  const store = useFaceStoreInstance();
  return useStore(store, selector);
}

export const useFaceStore: UseFaceStoreHook = Object.assign(useFaceStoreBase, {
  getState: () => activeGlobalFaceStore.getState(),
  setState: ((...args: Parameters<typeof activeGlobalFaceStore.setState>) =>
    activeGlobalFaceStore.setState(...args)) as PeerbotsFaceStoreApi["setState"],
  subscribe: ((...args: Parameters<typeof activeGlobalFaceStore.subscribe>) =>
    activeGlobalFaceStore.subscribe(...args)) as PeerbotsFaceStoreApi["subscribe"],
});

