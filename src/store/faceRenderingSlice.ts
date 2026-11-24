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
import type {
  FacsOverrides,
  ProfileConnectionReport,
  VizijStandardExpression,
} from "../types/profile";

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
  blinkNonce: number;
  extendedExpression: VizijStandardExpression | null;
  facsOverrides: FacsOverrides;
  vizijConnectionReport: ProfileConnectionReport | null;
  setFace: (face: Face) => void;
  setFaceByName: (name: string) => void;
  setFaceSettings: (settings: Partial<FaceSettings>) => void;
  resetPositioning: () => void;
  setGaze: (gaze: FaceGaze) => void;
  triggerBlink: () => void;
  setExtendedExpression: (expression: VizijStandardExpression | null) => void;
  setFacsOverrides: (overrides: FacsOverrides) => void;
  setVizijConnectionReport: (report: ProfileConnectionReport | null) => void;
  setLanguage: (lang: string | null) => void;
  setAssetBaseUrl: (assetBaseUrl: string) => void;
}

function clampUnit(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.max(-1, Math.min(1, value));
}

function clampWeight(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.max(0, Math.min(1, value));
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
    blinkNonce: 0,
    extendedExpression: null,
    facsOverrides: {},
    vizijConnectionReport: null,

    setFace: (face) => {
      set({ selectedFace: face, vizijConnectionReport: null });
    },

    setFaceByName: (name) => {
      const found = get().availableFaces.find((f) => f.name === name);
      if (found) {
        set({ selectedFace: found, vizijConnectionReport: null });
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
      const next: FaceGaze = {
        x: clampUnit(gaze.x),
        y: clampUnit(gaze.y),
      };
      if (gaze.weight !== undefined) {
        next.weight = clampWeight(gaze.weight);
      }
      set({ gaze: next });
    },

    triggerBlink: () => {
      set((state) => ({ blinkNonce: state.blinkNonce + 1 }));
    },

    setExtendedExpression: (extendedExpression) => {
      set({ extendedExpression });
    },

    setFacsOverrides: (facsOverrides) => {
      const clamped: FacsOverrides = {};
      for (const [key, val] of Object.entries(facsOverrides)) {
        if (typeof val === "number" && !Number.isNaN(val)) {
          clamped[key as keyof FacsOverrides] = clampWeight(val);
        }
      }
      set({ facsOverrides: clamped });
    },

    setVizijConnectionReport: (vizijConnectionReport) => {
      set({ vizijConnectionReport });
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
