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

export function useFaceStoreInstance(): PeerbotsFaceStoreApi {
  const context = useContext(FaceStoreContext);
  return context ?? globalFaceStore;
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
  getState: () => globalFaceStore.getState(),
  setState: ((...args: Parameters<typeof globalFaceStore.setState>) =>
    globalFaceStore.setState(...args)) as PeerbotsFaceStoreApi["setState"],
  subscribe: ((...args: Parameters<typeof globalFaceStore.subscribe>) =>
    globalFaceStore.subscribe(...args)) as PeerbotsFaceStoreApi["subscribe"],
});
