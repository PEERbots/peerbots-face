import type { StateCreator } from "zustand";
import type { FaceSpeechSlice } from "./faceSpeechSlice";
import {
  createBuiltInFaces,
  defaultFaceSettings,
  normalizeAssetBaseUrl,
  type Face,
  type FaceGaze,
  type FaceSettings,
} from "../types/face";

export interface FaceRenderingSliceOptions {
  assetBaseUrl?: string;
  initialFace?: Face;
  initialSettings?: Partial<FaceSettings>;
}

export interface FaceRenderingSlice {
  assetBaseUrl: string;
  availableFaces: Face[];
  selectedFace: Face;
  faceSettings: FaceSettings;
  gaze: FaceGaze;
  setFace: (face: Face) => void;
  setFaceByName: (name: string) => void;
  setFaceSettings: (settings: Partial<FaceSettings>) => void;
  resetPositioning: () => void;
  setGaze: (gaze: FaceGaze) => void;
  setLanguage: (lang: string | null) => void;
  setAssetBaseUrl: (assetBaseUrl: string) => void;
}

function clampUnit(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.max(-1, Math.min(1, value));
}

export function mergeFaceSettings(
  base: FaceSettings,
  patch?: Partial<FaceSettings>,
): FaceSettings {
  if (!patch) {
    return {
      ...base,
      offset: { ...base.offset },
      captions: {
        ...base.captions,
        offset: { ...base.captions.offset },
      },
      pixiSettings: base.pixiSettings ? { ...base.pixiSettings } : undefined,
      vizijSettings: base.vizijSettings ? { ...base.vizijSettings } : undefined,
    };
  }

  return {
    ...defaultFaceSettings,
    ...base,
    ...patch,
    offset: {
      ...defaultFaceSettings.offset,
      ...(base.offset || {}),
      ...(patch.offset || {}),
    },
    captions: {
      ...defaultFaceSettings.captions,
      ...(base.captions || {}),
      ...(patch.captions || {}),
      offset: {
        ...defaultFaceSettings.captions.offset,
        ...(base.captions?.offset || {}),
        ...(patch.captions?.offset || {}),
      },
    },
    pixiSettings: {
      ...defaultFaceSettings.pixiSettings!,
      ...(base.pixiSettings || {}),
      ...(patch.pixiSettings || {}),
    },
    vizijSettings: {
      ...defaultFaceSettings.vizijSettings!,
      ...(base.vizijSettings || {}),
      ...(patch.vizijSettings || {}),
    },
  };
}

export function createFaceRenderingSlice(
  options: FaceRenderingSliceOptions = {},
): StateCreator<FaceRenderingSlice & FaceSpeechSlice, [], [], FaceRenderingSlice> {
  const initialBaseUrl = normalizeAssetBaseUrl(options.assetBaseUrl);
  const initialFaces = createBuiltInFaces(initialBaseUrl);
  const initialSelectedFace = options.initialFace ?? initialFaces[0];
  const initialMergedSettings = mergeFaceSettings(
    defaultFaceSettings,
    options.initialSettings,
  );

  return (set, get) => ({
    assetBaseUrl: initialBaseUrl,
    availableFaces: initialFaces,
    selectedFace: initialSelectedFace,
    faceSettings: initialMergedSettings,
    gaze: { x: 0, y: 0 },

    setFace: (face) => {
      set({ selectedFace: face });
    },

    setFaceByName: (name) => {
      const found = get().availableFaces.find((f) => f.name === name);
      if (found) {
        set({ selectedFace: found });
      }
    },

    setFaceSettings: (settings) => {
      set((state) => ({
        faceSettings: mergeFaceSettings(state.faceSettings, settings),
      }));
    },

    resetPositioning: () => {
      set((state) => ({
        faceSettings: mergeFaceSettings(state.faceSettings, {
          zoom: 1,
          offset: { x: 0, y: 0 },
          rotation: 0,
        }),
      }));
    },

    setGaze: (gaze) => {
      set({
        gaze: {
          x: clampUnit(gaze.x),
          y: clampUnit(gaze.y),
        },
      });
    },

    setLanguage: (lang) => {
      set((state) => ({
        faceSettings: mergeFaceSettings(state.faceSettings, {
          selectedLanguage: lang,
        }),
      }));
    },

    setAssetBaseUrl: (assetBaseUrl) => {
      const normalized = normalizeAssetBaseUrl(assetBaseUrl);
      const updatedFaces = createBuiltInFaces(normalized);
      const currentName = get().selectedFace?.name;
      const matchingUpdated = updatedFaces.find((f) => f.name === currentName);
      set({
        assetBaseUrl: normalized,
        availableFaces: updatedFaces,
        selectedFace: matchingUpdated ?? get().selectedFace,
      });
    },
  });
}
