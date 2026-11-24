import type { PeerbotsColor } from "@peerbots/core";
import type { VizijAssetBundle } from "@vizij/runtime-react";

export type { PeerbotsColor };
export type FaceColor = PeerbotsColor;

export const PEERBOTS_COLORS: readonly PeerbotsColor[] = [
  "Light Blue",
  "Blue",
  "Green",
  "Red",
  "Purple",
  "Pink",
  "Yellow",
  "Orange",
  "Grey",
  "Black",
  "White",
] as const;

export type PeerbotsEmotion =
  | "Neutral"
  | "Surprised"
  | "Happy"
  | "Sad"
  | "Concerned"
  | "Sleepy";

export type FaceEmotion = PeerbotsEmotion;

export const PEERBOTS_EMOTIONS: readonly PeerbotsEmotion[] = [
  "Neutral",
  "Surprised",
  "Happy",
  "Sad",
  "Concerned",
  "Sleepy",
] as const;

export interface FaceMessage {
  title: string;
  speech: string;
  color: PeerbotsColor;
  emotion: PeerbotsEmotion;
  metadata?: Record<string, string | number>;
}

export const DEFAULT_FACE_MESSAGE: FaceMessage = {
  title: "Ready",
  speech: "",
  color: "Light Blue",
  emotion: "Neutral",
};

export const CONNECTION_FACE_MESSAGE: FaceMessage = {
  title: "Connecting",
  speech: "Connecting",
  color: "Light Blue",
  emotion: "Neutral",
};

export interface FaceBase {
  kind: string;
  name: string;
}

export interface TimedViseme {
  time: number;
  type: string;
  value: string;
}

export interface AmplitudePoint {
  time: number;
  value: number;
}

export type PixiMouthShape =
  | "Hugo"
  | "ZigZag"
  | "Ellipse"
  | "Beak"
  | "Equalizer"
  | "PixelMatrix"
  | "Cat"
  | "Capsule"
  | "Arc"
  | "SoftCurve";

export type VectorFaceStyleId =
  | "hugo"
  | "mochi"
  | "pebble"
  | "dash"
  | "orbit"
  | "pixel"
  | "slate";

export type PixiCheekStyle = "coralOval" | "pinkBlush" | "warmOval";

export type PixiEyebrowStyle =
  | "Hugo"
  | "delicateArch"
  | "softArch"
  | "thickArch"
  | "flatBar"
  | "vector";

export type PixiEyeConfig =
  | { kind: "spritesheet"; path: string }
  | { kind: "vector"; style: VectorFaceStyleId };

export type PixiColorRole = "background" | "accent";

export type FaceStyleCategory = "cute" | "balanced" | "sleek" | "classic";

export type PixiAvatar = FaceBase & {
  kind: "PixiFace";
  type: "avatar";
  mouth: PixiMouthShape;
  eyes: PixiEyeConfig;
  cheeks:
    | { kind: "texture"; path: string }
    | { kind: "vector"; style?: PixiCheekStyle }
    | null;
  eyebrows: PixiEyebrowStyle | null;
  colorRole?: PixiColorRole;
  category?: FaceStyleCategory;
};

export type PixiText = FaceBase & {
  kind: "PixiFace";
  type: "text";
  showEmotion: "emoticon" | "emoji" | "none";
  showText: boolean;
};

export type PixiFace = PixiAvatar | PixiText;

export type VizijFace = FaceBase & {
  kind: "Vizij";
  assetBundle: VizijAssetBundle;
};

export type Face = PixiFace | VizijFace;

export interface FaceGaze {
  /** Horizontal normalized gaze target in [-1, 1] */
  x: number;
  /** Vertical normalized gaze target in [-1, 1] */
  y: number;
  /** Optional attention weight in [0, 1] (0 = autonomous idle, 1 = hold target) */
  weight?: number;
}

export interface VizijSettings {
  faceExpressivity: number;
}

export interface PixiSettings {
  eyeDisplay: "default" | "none";
  mouthDisplay: "default" | "none";
  cheekDisplay: "default" | "none";
  emotionDisplay: "emoticon" | "emoji" | "none";
}

export type SpeechQueueMode = "interrupt" | "queue";

export type CaptionStyle = "pill" | "outline";

export interface CaptionSettings {
  enabled: boolean;
  fontSize: number;
  offset: { x: number; y: number };
  style?: CaptionStyle;
}

export interface FaceSettings {
  zoom: number;
  offset: { x: number; y: number };
  rotation: number;
  autoRotate: boolean;
  showFullScreenButton: boolean;
  showScrollButton: boolean;
  amplitudeGain: number;
  vizijSettings?: VizijSettings;
  pixiSettings?: PixiSettings;
  selectedLanguage: string | null;
  speechQueueMode?: SpeechQueueMode;
  captions: CaptionSettings;
}

export const defaultFaceSettings: FaceSettings = {
  zoom: 1,
  offset: { x: 0, y: 0 },
  rotation: 0,
  autoRotate: true,
  showFullScreenButton: true,
  showScrollButton: true,
  amplitudeGain: 1,
  vizijSettings: {
    faceExpressivity: 1,
  },
  pixiSettings: {
    eyeDisplay: "default",
    mouthDisplay: "default",
    cheekDisplay: "default",
    emotionDisplay: "emoticon",
  },
  selectedLanguage: "English",
  speechQueueMode: "interrupt",
  captions: {
    enabled: false,
    fontSize: 32,
    offset: { x: 0, y: 0 },
    style: "pill",
  },
};

export function normalizeAssetBaseUrl(assetBaseUrl: string = "/FaceAssets"): string {
  const trimmed = assetBaseUrl.trim();
  if (!trimmed) {
    return "/FaceAssets";
  }
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

export function createBuiltInPixiFaces(assetBaseUrl?: string): PixiFace[] {
  const base = normalizeAssetBaseUrl(assetBaseUrl);
  return [
    {
      kind: "PixiFace",
      type: "avatar",
      name: "Hugo",
      mouth: "Hugo",
      eyes: {
        kind: "vector",
        style: "hugo",
      },
      cheeks: { kind: "vector", style: "coralOval" },
      eyebrows: "delicateArch",
      colorRole: "background",
      category: "cute",
    },
    {
      kind: "PixiFace",
      type: "avatar",
      name: "Simple",
      mouth: "Ellipse",
      eyes: {
        kind: "vector",
        style: "hugo",
      },
      cheeks: null,
      eyebrows: null,
      colorRole: "background",
      category: "classic",
    },
    {
      kind: "PixiFace",
      type: "avatar",
      name: "Robotic",
      mouth: "ZigZag",
      eyes: {
        kind: "spritesheet",
        path: `${base}/Robotic/robotic_spritesheet.json`,
      },
      cheeks: null,
      eyebrows: null,
      colorRole: "background",
      category: "classic",
    },
    {
      kind: "PixiFace",
      type: "text",
      name: "Display",
      showEmotion: "emoticon",
      showText: true,
    },
    {
      kind: "PixiFace",
      type: "avatar",
      name: "Mochi",
      mouth: "Cat",
      eyes: {
        kind: "vector",
        style: "mochi",
      },
      cheeks: { kind: "vector", style: "pinkBlush" },
      eyebrows: null,
      colorRole: "background",
      category: "cute",
    },
    {
      kind: "PixiFace",
      type: "avatar",
      name: "Pebble",
      mouth: "SoftCurve",
      eyes: {
        kind: "vector",
        style: "pebble",
      },
      cheeks: null,
      eyebrows: "softArch",
      colorRole: "background",
      category: "cute",
    },
    {
      kind: "PixiFace",
      type: "avatar",
      name: "Dash",
      mouth: "Equalizer",
      eyes: {
        kind: "vector",
        style: "dash",
      },
      cheeks: null,
      eyebrows: null,
      colorRole: "accent",
      category: "balanced",
    },
    {
      kind: "PixiFace",
      type: "avatar",
      name: "Orbit",
      mouth: "Arc",
      eyes: {
        kind: "vector",
        style: "orbit",
      },
      cheeks: null,
      eyebrows: "thickArch",
      colorRole: "background",
      category: "balanced",
    },
    {
      kind: "PixiFace",
      type: "avatar",
      name: "Pixel",
      mouth: "PixelMatrix",
      eyes: {
        kind: "vector",
        style: "pixel",
      },
      cheeks: null,
      eyebrows: null,
      colorRole: "accent",
      category: "sleek",
    },
    {
      kind: "PixiFace",
      type: "avatar",
      name: "Slate",
      mouth: "Capsule",
      eyes: {
        kind: "vector",
        style: "slate",
      },
      cheeks: null,
      eyebrows: "flatBar",
      colorRole: "background",
      category: "sleek",
    },
  ];
}

export function createCustomVizijFace(glbUrl: string = ""): VizijFace {
  return {
    kind: "Vizij",
    name: "Custom Face",
    assetBundle: {
      namespace: "custom",
      glb: {
        kind: "url",
        src: glbUrl,
        aggressiveImport: true,
      },
    },
  };
}

export function createIncludedVizijFaces(assetBaseUrl?: string): VizijFace[] {
  const base = normalizeAssetBaseUrl(assetBaseUrl);
  return [
    {
      kind: "Vizij",
      name: "Hugo - Expressive",
      assetBundle: {
        namespace: "hugo",
        glb: {
          kind: "url",
          src: `${base}/Vizij/Hugo.glb`,
          aggressiveImport: true,
        },
      },
    },
    createCustomVizijFace(""),
  ];
}

export function createBuiltInFaces(assetBaseUrl?: string): Face[] {
  return [
    ...createBuiltInPixiFaces(assetBaseUrl),
    ...createIncludedVizijFaces(assetBaseUrl),
  ];
}

export const builtInFaces: PixiFace[] = createBuiltInPixiFaces();
export const customFace: VizijFace = createCustomVizijFace();
export const includedVizijFaces: VizijFace[] = createIncludedVizijFaces();
export const availableFaces: Face[] = [...builtInFaces, ...includedVizijFaces];
export const defaultFace: PixiFace = builtInFaces[0];

export interface FaceCapabilities {
  canExpressColor: boolean | string;
  canExpressEmotion: boolean | string;
  canLipSync: boolean | string;
}

export const getFaceCapabilities = (face?: FaceBase): FaceCapabilities => {
  if (!face) {
    return {
      canExpressColor: false,
      canExpressEmotion: false,
      canLipSync: false,
    };
  }
  if (face.kind === "PixiFace" && "type" in face) {
    const pixiFace = face as PixiFace;
    if (pixiFace.type === "avatar") {
      const isVector = pixiFace.eyes.kind === "vector";
      return {
        canExpressColor:
          pixiFace.colorRole === "accent"
            ? "Accent Color Change"
            : "Background Color Change",
        canExpressEmotion: isVector ? "Animated Expression" : "Smooth Swap",
        canLipSync:
          pixiFace.mouth === "ZigZag" && !isVector
            ? "Random mouth motions"
            : "Timed mouth motions",
      };
    }
    if (pixiFace.type === "text") {
      return {
        canExpressColor: "Background Color Change",
        canExpressEmotion:
          pixiFace.showEmotion === "none" ? false : pixiFace.showEmotion,
        canLipSync: "Cursor movement",
      };
    }
  }
  if (face.kind === "Vizij") {
    return {
      canExpressColor: "Background Color Change",
      canExpressEmotion: "Animated Expression",
      canLipSync: "Lip-sync or random mouth motions",
    };
  }
  return {
    canExpressColor: false,
    canExpressEmotion: false,
    canLipSync: false,
  };
};
