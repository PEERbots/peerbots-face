import { createStore, type StoreApi } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_FACE_MESSAGE,
  createBuiltInFaces,
  defaultFaceSettings,
  type Face,
  type FaceMessage,
  type FaceSettings,
} from "../types/face";
import {
  createFaceRenderingSlice,
  mergeFaceSettings,
  type FaceRenderingSlice,
  type FaceRenderingSliceOptions,
} from "./faceRenderingSlice";
import {
  createFaceSpeechSlice,
  type FaceSpeechSlice,
  type FaceSpeechSliceOptions,
} from "./faceSpeechSlice";

export type PeerbotsFaceStore = FaceRenderingSlice & FaceSpeechSlice;

export interface CreatePeerbotsFaceStoreOptions
  extends FaceRenderingSliceOptions,
    FaceSpeechSliceOptions {
  /** Optional localStorage key. When omitted, store runs purely in-memory. */
  persistName?: string;
}

export type PeerbotsFaceStoreApi = StoreApi<PeerbotsFaceStore>;

function restorePersistedFace(
  persistedSelection: unknown,
  builtIns: readonly Face[],
  fallback: Face,
): Face {
  if (typeof persistedSelection === "string") {
    return builtIns.find((f) => f.name === persistedSelection) ?? fallback;
  }

  if (persistedSelection && typeof persistedSelection === "object") {
    const selectionObj = persistedSelection as Record<string, unknown>;
    if (typeof selectionObj.name === "string") {
      const found = builtIns.find((f) => f.name === selectionObj.name);
      if (found) {
        if (
          found.kind === "Vizij" &&
          selectionObj.assetBundle &&
          typeof selectionObj.assetBundle === "object"
        ) {
          const persistedBundle = selectionObj.assetBundle as Record<
            string,
            unknown
          >;
          const persistedGlb =
            persistedBundle.glb && typeof persistedBundle.glb === "object"
              ? (persistedBundle.glb as Record<string, unknown>)
              : {};
          return {
            ...found,
            assetBundle: {
              ...found.assetBundle,
              ...persistedBundle,
              glb: {
                ...found.assetBundle.glb,
                ...persistedGlb,
              } as typeof found.assetBundle.glb,
            },
          };
        }
        return found;
      }
      if (typeof selectionObj.kind === "string") {
        return persistedSelection as Face;
      }
    }
  }

  return fallback;
}

export function createPeerbotsFaceStore(
  options: CreatePeerbotsFaceStoreOptions = {},
): PeerbotsFaceStoreApi {
  const stateInitializer = (
    ...args: Parameters<ReturnType<typeof createFaceRenderingSlice>>
  ): PeerbotsFaceStore => ({
    ...createFaceRenderingSlice(options)(...args),
    ...createFaceSpeechSlice(options)(...args),
  });

  if (!options.persistName) {
    return createStore<PeerbotsFaceStore>()(stateInitializer);
  }

  const builtIns = createBuiltInFaces(options.assetBaseUrl);
  const fallbackFace = options.initialFace ?? builtIns[0];

  return createStore<PeerbotsFaceStore>()(
    persist(stateInitializer, {
      name: options.persistName,
      version: 1,
      partialize: (state) => ({
        selectedFace: state.selectedFace,
        faceSettings: state.faceSettings,
        selectedVoiceUri: state.selectedVoiceUri,
        lastMessage: state.lastMessage,
      }),
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as Partial<PeerbotsFaceStore>;
        const restoredFace = restorePersistedFace(
          persisted.selectedFace,
          currentState.availableFaces,
          fallbackFace,
        );
        const restoredSettings = persisted.faceSettings
          ? mergeFaceSettings(
              defaultFaceSettings,
              persisted.faceSettings as Partial<FaceSettings>,
            )
          : currentState.faceSettings;

        return {
          ...currentState,
          selectedFace: restoredFace,
          selectedVoiceUri: persisted.selectedVoiceUri ?? null,
          faceSettings: restoredSettings,
          lastMessage:
            (persisted.lastMessage as FaceMessage | undefined) ??
            options.initialMessage ??
            DEFAULT_FACE_MESSAGE,
          isSpeaking: false,
        };
      },
    }),
  );
}

export const globalFaceStore: PeerbotsFaceStoreApi = createPeerbotsFaceStore({
  persistName: "faceSettings",
});
