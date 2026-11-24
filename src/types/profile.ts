import { color_mapping, hexToRgb } from "../helpers/color_mappers";
import type { FaceGaze, FaceMessage, FaceSettings, PeerbotsEmotion } from "./face";

export interface VizijProfileKeyMeta {
  tier?: string;
  facs?: number;
  arkit?: string;
}

export interface VizijProfileKey {
  path: string;
  kind: "input" | "output";
  value_type: "f32" | "str" | "bool";
  min?: number;
  max?: number;
  default_value: { f32?: number; str?: string; bool?: boolean };
  meta?: VizijProfileKeyMeta;
}

export interface VizijProfileDefinition {
  id: string;
  version: string;
  title: string;
  description: string;
  scope: "face" | "device";
  keys: readonly VizijProfileKey[];
}

export const PEERBOTS_PROFILE_KEYS = {
  expressionNeutral: "peerbots/expression/neutral",
  expressionSurprised: "peerbots/expression/surprised",
  expressionHappy: "peerbots/expression/happy",
  expressionSad: "peerbots/expression/sad",
  expressionConcerned: "peerbots/expression/concerned",
  expressionSleepy: "peerbots/expression/sleepy",
  gazeX: "peerbots/gaze/x",
  gazeY: "peerbots/gaze/y",
  gazeWeight: "peerbots/gaze/weight",
  blink: "peerbots/blink",
  colorR: "peerbots/color/r",
  colorG: "peerbots/color/g",
  colorB: "peerbots/color/b",
  speechSpeaking: "peerbots/speech/speaking",
  speechAmplitude: "peerbots/speech/amplitude",
  sceneScale: "peerbots/scene/scale",
  sceneOffsetX: "peerbots/scene/offset/x",
  sceneOffsetY: "peerbots/scene/offset/y",
  sceneRotation: "peerbots/scene/rotation",
} as const;

export const PEERBOTS_FACE_PROFILE: VizijProfileDefinition = {
  id: "peerbots-face",
  version: "v1",
  title: "Peerbots Face",
  description:
    "Self-contained Peerbots face control profile (emotions, gaze, blink, color, speech state/amplitude, and scene framing). Designed to work standalone or composed alongside Vizij's vizij-face standard.",
  scope: "face",
  keys: [
    {
      path: PEERBOTS_PROFILE_KEYS.expressionNeutral,
      kind: "input",
      value_type: "f32",
      min: 0.0,
      max: 1.0,
      default_value: { f32: 1.0 },
      meta: { tier: "expression" },
    },
    {
      path: PEERBOTS_PROFILE_KEYS.expressionSurprised,
      kind: "input",
      value_type: "f32",
      min: 0.0,
      max: 1.0,
      default_value: { f32: 0.0 },
      meta: { tier: "expression" },
    },
    {
      path: PEERBOTS_PROFILE_KEYS.expressionHappy,
      kind: "input",
      value_type: "f32",
      min: 0.0,
      max: 1.0,
      default_value: { f32: 0.0 },
      meta: { tier: "expression" },
    },
    {
      path: PEERBOTS_PROFILE_KEYS.expressionSad,
      kind: "input",
      value_type: "f32",
      min: 0.0,
      max: 1.0,
      default_value: { f32: 0.0 },
      meta: { tier: "expression" },
    },
    {
      path: PEERBOTS_PROFILE_KEYS.expressionConcerned,
      kind: "input",
      value_type: "f32",
      min: 0.0,
      max: 1.0,
      default_value: { f32: 0.0 },
      meta: { tier: "expression" },
    },
    {
      path: PEERBOTS_PROFILE_KEYS.expressionSleepy,
      kind: "input",
      value_type: "f32",
      min: 0.0,
      max: 1.0,
      default_value: { f32: 0.0 },
      meta: { tier: "expression" },
    },
    {
      path: PEERBOTS_PROFILE_KEYS.gazeX,
      kind: "input",
      value_type: "f32",
      min: -1.0,
      max: 1.0,
      default_value: { f32: 0.0 },
      meta: { tier: "gaze" },
    },
    {
      path: PEERBOTS_PROFILE_KEYS.gazeY,
      kind: "input",
      value_type: "f32",
      min: -1.0,
      max: 1.0,
      default_value: { f32: 0.0 },
      meta: { tier: "gaze" },
    },
    {
      path: PEERBOTS_PROFILE_KEYS.gazeWeight,
      kind: "input",
      value_type: "f32",
      min: 0.0,
      max: 1.0,
      default_value: { f32: 0.0 },
      meta: { tier: "gaze" },
    },
    {
      path: PEERBOTS_PROFILE_KEYS.blink,
      kind: "input",
      value_type: "f32",
      min: 0.0,
      max: 1.0,
      default_value: { f32: 0.0 },
      meta: { tier: "gaze" },
    },
    {
      path: PEERBOTS_PROFILE_KEYS.colorR,
      kind: "input",
      value_type: "f32",
      min: 0.0,
      max: 1.0,
      default_value: { f32: 0.671 },
      meta: { tier: "appearance" },
    },
    {
      path: PEERBOTS_PROFILE_KEYS.colorG,
      kind: "input",
      value_type: "f32",
      min: 0.0,
      max: 1.0,
      default_value: { f32: 0.89 },
      meta: { tier: "appearance" },
    },
    {
      path: PEERBOTS_PROFILE_KEYS.colorB,
      kind: "input",
      value_type: "f32",
      min: 0.0,
      max: 1.0,
      default_value: { f32: 0.98 },
      meta: { tier: "appearance" },
    },
    {
      path: PEERBOTS_PROFILE_KEYS.speechSpeaking,
      kind: "input",
      value_type: "f32",
      min: 0.0,
      max: 1.0,
      default_value: { f32: 0.0 },
      meta: { tier: "viseme" },
    },
    {
      path: PEERBOTS_PROFILE_KEYS.speechAmplitude,
      kind: "input",
      value_type: "f32",
      min: 0.0,
      max: 1.0,
      default_value: { f32: 0.0 },
      meta: { tier: "viseme" },
    },
    {
      path: PEERBOTS_PROFILE_KEYS.sceneScale,
      kind: "input",
      value_type: "f32",
      min: 0.1,
      max: 4.0,
      default_value: { f32: 1.0 },
      meta: { tier: "framing" },
    },
    {
      path: PEERBOTS_PROFILE_KEYS.sceneOffsetX,
      kind: "input",
      value_type: "f32",
      min: -1.0,
      max: 1.0,
      default_value: { f32: 0.0 },
      meta: { tier: "framing" },
    },
    {
      path: PEERBOTS_PROFILE_KEYS.sceneOffsetY,
      kind: "input",
      value_type: "f32",
      min: -1.0,
      max: 1.0,
      default_value: { f32: 0.0 },
      meta: { tier: "framing" },
    },
    {
      path: PEERBOTS_PROFILE_KEYS.sceneRotation,
      kind: "input",
      value_type: "f32",
      min: 0.0,
      max: 360.0,
      default_value: { f32: 0.0 },
      meta: { tier: "framing" },
    },
  ],
};

/**
 * 27 expressions defined by the Vizij Face Standard (`standard/vizij/expression/<name>`):
 * 25 ROS4HRI `hri_msgs/Expression` names plus `concerned` and `sleepy`.
 */
export const VIZIJ_STANDARD_EXPRESSIONS = [
  "neutral",
  "angry",
  "sad",
  "happy",
  "surprised",
  "disgusted",
  "scared",
  "pleading",
  "vulnerable",
  "despaired",
  "guilty",
  "disappointed",
  "embarrassed",
  "horrified",
  "skeptical",
  "annoyed",
  "furious",
  "suspicious",
  "rejected",
  "bored",
  "tired",
  "asleep",
  "confused",
  "amazed",
  "excited",
  "concerned",
  "sleepy",
] as const;

export type VizijStandardExpression =
  (typeof VIZIJ_STANDARD_EXPRESSIONS)[number];

export const PEERBOTS_EMOTION_TO_STANDARD: Record<
  PeerbotsEmotion,
  VizijStandardExpression
> = {
  Neutral: "neutral",
  Surprised: "surprised",
  Happy: "happy",
  Sad: "sad",
  Concerned: "concerned",
  Sleepy: "sleepy",
};

export const VIZIJ_STANDARD_VISEMES = [
  "sil",
  "PP",
  "FF",
  "TH",
  "DD",
  "kk",
  "CH",
  "SS",
  "nn",
  "RR",
  "aa",
  "E",
  "ih",
  "oh",
  "ou",
] as const;

export type VizijStandardViseme = (typeof VIZIJ_STANDARD_VISEMES)[number];

/**
 * Subset of Vizij muscle-tier controls (`standard/vizij/face/<control>`)
 * keyed to FACS Action Units / ARKit blendshapes.
 */
export const FACS_CONTROLS = [
  "brow_inner_up",
  "brow_outer_up_left",
  "brow_outer_up_right",
  "brow_down_left",
  "brow_down_right",
  "eye_wide_left",
  "eye_wide_right",
  "eye_squint_left",
  "eye_squint_right",
  "eye_closed_left",
  "eye_closed_right",
  "cheek_raise_left",
  "cheek_raise_right",
  "cheek_puff",
  "nose_sneer_left",
  "nose_sneer_right",
  "tongue_out",
  "mouth_smile_left",
  "mouth_smile_right",
  "mouth_frown_left",
  "mouth_frown_right",
  "mouth_press_left",
  "mouth_press_right",
  "mouth_pucker",
  "mouth_funnel",
  "mouth_stretch_left",
  "mouth_stretch_right",
  "mouth_upper_up_left",
  "mouth_upper_up_right",
  "mouth_lower_down_left",
  "mouth_lower_down_right",
  "jaw_open",
  "jaw_left",
  "jaw_right",
  "jaw_forward",
] as const;

export type FacsControl = (typeof FACS_CONTROLS)[number];
export type FacsOverrides = Partial<Record<FacsControl, number>>;

export type PeerbotsConversationState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking";

export const VIZIJ_STANDARD_KEYS = {
  leftEyeX: "standard/vizij/left_eye/pos/x",
  leftEyeY: "standard/vizij/left_eye/pos/y",
  rightEyeX: "standard/vizij/right_eye/pos/x",
  rightEyeY: "standard/vizij/right_eye/pos/y",
  leftTopLid: "standard/vizij/left_eye_top_eyelid/pos/y",
  rightTopLid: "standard/vizij/right_eye_top_eyelid/pos/y",
  blink: "standard/vizij/blink",
  gazeTargetX: "standard/vizij/gaze/target/x",
  gazeTargetY: "standard/vizij/gaze/target/y",
  gazeTargetWeight: "standard/vizij/gaze/target/weight",
  lipsyncGain: "standard/vizij/lipsync/gain",
  conversationSpeaking: "standard/vizij/conversation/speaking",
  conversationUserSpeaking: "standard/vizij/conversation/user_speaking",
  conversationThinking: "standard/vizij/conversation/thinking",
  expression: (name: VizijStandardExpression) =>
    `standard/vizij/expression/${name}`,
  viseme: (shape: VizijStandardViseme) => `standard/vizij/viseme/${shape}`,
  facs: (control: FacsControl) => `standard/vizij/face/${control}`,
} as const;

export interface ProfileChannelStatus {
  connected: number;
  total: number;
  supported: boolean;
}

export interface ProfileConnectionReport {
  declaredProfiles: string[];
  emotions: ProfileChannelStatus;
  visemes: ProfileChannelStatus;
  gaze: boolean;
  blink: boolean;
  color: boolean;
  amplitude: boolean;
  sceneTransform: {
    scale: boolean;
    offset: boolean;
    rotation: boolean;
  };
  conversation: boolean;
  facs: ProfileChannelStatus;
  usesLegacyRigPaths: boolean;
}

function stripRigPrefix(path: string): string {
  const match = path.match(/^rig\/[^/]+\/(.+)$/);
  return match ? match[1] : path;
}

/**
 * Inspects a Vizij GLB's exposed input paths (from `describe(glb)` or `runtime.listKeys()`)
 * and reports which `vizij-face` + `peerbots-face` channels can be auto-connected.
 */
export function inspectGlbProfileConnection(
  availablePaths: readonly string[],
  declaredProfiles: readonly string[] = [],
): ProfileConnectionReport {
  const normalized = new Set(availablePaths.map(stripRigPrefix));

  const coreExpressions: VizijStandardExpression[] = [
    "neutral",
    "surprised",
    "happy",
    "sad",
    "concerned",
    "sleepy",
  ];
  const peerbotsEmotionsConnected = coreExpressions.filter((e) =>
    normalized.has(`peerbots/expression/${e}`),
  ).length;
  const standardEmotionsConnected = coreExpressions.filter((e) =>
    normalized.has(VIZIJ_STANDARD_KEYS.expression(e)),
  ).length;

  const legacyEmotions = ["surprise", "happy", "sad", "concerned", "sleepy"];
  const legacyEmotionsConnected = legacyEmotions.filter((e) =>
    normalized.has(`emotions/${e}.weight`),
  ).length;

  const standardVisemesConnected = VIZIJ_STANDARD_VISEMES.filter((v) =>
    normalized.has(VIZIJ_STANDARD_KEYS.viseme(v)),
  ).length;
  const legacyVisemesConnected = Array.from(normalized).filter((p) =>
    p.startsWith("visemes/"),
  ).length;

  const facsConnected = FACS_CONTROLS.filter((c) =>
    normalized.has(VIZIJ_STANDARD_KEYS.facs(c)),
  ).length;

  const hasStandardColor =
    normalized.has(PEERBOTS_PROFILE_KEYS.colorR) &&
    normalized.has(PEERBOTS_PROFILE_KEYS.colorG) &&
    normalized.has(PEERBOTS_PROFILE_KEYS.colorB);
  const hasLegacyColor =
    normalized.has("background/color/r") &&
    normalized.has("background/color/g") &&
    normalized.has("background/color/b");

  const hasStandardGaze =
    normalized.has(PEERBOTS_PROFILE_KEYS.gazeX) ||
    normalized.has(VIZIJ_STANDARD_KEYS.gazeTargetX) ||
    normalized.has(VIZIJ_STANDARD_KEYS.leftEyeX);

  const hasStandardBlink =
    normalized.has(PEERBOTS_PROFILE_KEYS.blink) ||
    normalized.has(VIZIJ_STANDARD_KEYS.blink) ||
    normalized.has(VIZIJ_STANDARD_KEYS.leftTopLid);

  const hasConversation =
    normalized.has(PEERBOTS_PROFILE_KEYS.speechSpeaking) ||
    normalized.has(VIZIJ_STANDARD_KEYS.conversationSpeaking);

  const hasScale =
    normalized.has(PEERBOTS_PROFILE_KEYS.sceneScale) ||
    normalized.has("scene/scale/x");
  const hasOffset =
    (normalized.has(PEERBOTS_PROFILE_KEYS.sceneOffsetX) &&
      normalized.has(PEERBOTS_PROFILE_KEYS.sceneOffsetY)) ||
    (normalized.has("scene/translation/x") &&
      normalized.has("scene/translation/y"));
  const hasRotation = normalized.has(PEERBOTS_PROFILE_KEYS.sceneRotation);

  const modernEmotionsConnected = Math.max(
    peerbotsEmotionsConnected,
    standardEmotionsConnected,
  );
  const usesLegacyRigPaths =
    modernEmotionsConnected === 0 &&
    (legacyEmotionsConnected > 0 || hasLegacyColor || legacyVisemesConnected > 0);

  const emotionsConnected =
    modernEmotionsConnected > 0
      ? modernEmotionsConnected
      : legacyEmotionsConnected;
  const visemesConnected =
    standardVisemesConnected > 0
      ? standardVisemesConnected
      : Math.min(legacyVisemesConnected, VIZIJ_STANDARD_VISEMES.length);

  return {
    declaredProfiles: [...declaredProfiles],
    emotions: {
      connected: emotionsConnected,
      total: coreExpressions.length,
      supported: emotionsConnected > 0,
    },
    visemes: {
      connected: visemesConnected,
      total: VIZIJ_STANDARD_VISEMES.length,
      supported: visemesConnected > 0,
    },
    gaze: hasStandardGaze,
    blink: hasStandardBlink,
    color: hasStandardColor || hasLegacyColor,
    amplitude: normalized.has(PEERBOTS_PROFILE_KEYS.speechAmplitude),
    sceneTransform: {
      scale: hasScale,
      offset: hasOffset,
      rotation: hasRotation,
    },
    conversation: hasConversation,
    facs: {
      connected: facsConnected,
      total: FACS_CONTROLS.length,
      supported: facsConnected > 0,
    },
    usesLegacyRigPaths,
  };
}

export interface ProfileControlInput {
  message: FaceMessage;
  gaze: FaceGaze;
  settings: FaceSettings;
  isSpeaking: boolean;
  currentAmplitude: number;
  extendedExpression?: VizijStandardExpression | null;
  facsOverrides?: FacsOverrides;
  blinkLevel?: number;
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function clampSigned(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(-1, Math.min(1, value));
}

/**
 * Projects `@peerbots/face` store state into the canonical `peerbots-face` + `vizij-face`
 * key/value map consumed by both PixiJS and Vizij 1.0 renderers.
 */
export function buildProfileControlValues(
  input: ProfileControlInput,
): Record<string, number> {
  const {
    message,
    gaze,
    settings,
    isSpeaking,
    currentAmplitude,
    extendedExpression = null,
    facsOverrides,
    blinkLevel = 0,
  } = input;

  const expressivity = clamp01(
    settings.vizijSettings?.faceExpressivity ?? 1,
  );
  const activeExpression: VizijStandardExpression =
    extendedExpression ?? PEERBOTS_EMOTION_TO_STANDARD[message.emotion] ?? "neutral";

  const values: Record<string, number> = {};

  // Core Peerbots + Vizij standard expression weights
  const coreExpressions: VizijStandardExpression[] = [
    "neutral",
    "surprised",
    "happy",
    "sad",
    "concerned",
    "sleepy",
  ];
  for (const expr of coreExpressions) {
    const weight = expr === activeExpression ? expressivity : 0;
    values[`peerbots/expression/${expr}`] = weight;
    values[VIZIJ_STANDARD_KEYS.expression(expr)] = weight;
  }
  if (!coreExpressions.includes(activeExpression)) {
    values[VIZIJ_STANDARD_KEYS.expression(activeExpression)] = expressivity;
  }

  // Gaze target ([0, 1] Vizij frame + [-1, 1] Peerbots signed) + weight
  const gx = clampSigned(gaze.x);
  const gy = clampSigned(gaze.y);
  const implicitWeight = Math.abs(gx) > 0.001 || Math.abs(gy) > 0.001 ? 1 : 0;
  const gazeWeight = clamp01(gaze.weight ?? implicitWeight);
  const clampedBlink = clamp01(blinkLevel);

  values[PEERBOTS_PROFILE_KEYS.gazeX] = gx;
  values[PEERBOTS_PROFILE_KEYS.gazeY] = gy;
  values[PEERBOTS_PROFILE_KEYS.gazeWeight] = gazeWeight;
  values[PEERBOTS_PROFILE_KEYS.blink] = clampedBlink;

  values[VIZIJ_STANDARD_KEYS.gazeTargetX] = (gx + 1) / 2;
  values[VIZIJ_STANDARD_KEYS.gazeTargetY] = (gy + 1) / 2;
  values[VIZIJ_STANDARD_KEYS.gazeTargetWeight] = gazeWeight;
  values[VIZIJ_STANDARD_KEYS.leftEyeX] = gx;
  values[VIZIJ_STANDARD_KEYS.leftEyeY] = -gy;
  values[VIZIJ_STANDARD_KEYS.rightEyeX] = gx;
  values[VIZIJ_STANDARD_KEYS.rightEyeY] = -gy;
  values[VIZIJ_STANDARD_KEYS.blink] = clampedBlink;
  values[VIZIJ_STANDARD_KEYS.lipsyncGain] = Math.max(0, settings.amplitudeGain ?? 1);

  // Speaking state (idle vs speaking)
  const speakingVal = isSpeaking ? 1 : 0;
  values[PEERBOTS_PROFILE_KEYS.speechSpeaking] = speakingVal;
  values[VIZIJ_STANDARD_KEYS.conversationSpeaking] = speakingVal;

  // Optional FACS muscle overrides
  if (facsOverrides) {
    for (const [control, weight] of Object.entries(facsOverrides)) {
      if (typeof weight === "number" && !Number.isNaN(weight)) {
        values[VIZIJ_STANDARD_KEYS.facs(control as FacsControl)] = clamp01(weight);
      }
    }
  }

  // Peerbots appearance, amplitude, and scene framing
  const rgb = hexToRgb(color_mapping[message.color] ?? color_mapping["Light Blue"]) ?? {
    r: 171,
    g: 227,
    b: 250,
  };
  values[PEERBOTS_PROFILE_KEYS.colorR] = rgb.r / 255;
  values[PEERBOTS_PROFILE_KEYS.colorG] = rgb.g / 255;
  values[PEERBOTS_PROFILE_KEYS.colorB] = rgb.b / 255;
  values[PEERBOTS_PROFILE_KEYS.speechAmplitude] = clamp01(
    isSpeaking ? currentAmplitude * (settings.amplitudeGain ?? 1) : 0,
  );
  values[PEERBOTS_PROFILE_KEYS.sceneScale] = Math.max(
    0.1,
    Math.min(4, settings.zoom ?? 1),
  );
  values[PEERBOTS_PROFILE_KEYS.sceneOffsetX] = clampSigned(
    (settings.offset?.x ?? 0) / 500,
  );
  values[PEERBOTS_PROFILE_KEYS.sceneOffsetY] = clampSigned(
    (settings.offset?.y ?? 0) / 500,
  );
  values[PEERBOTS_PROFILE_KEYS.sceneRotation] =
    (((settings.rotation ?? 0) % 360) + 360) % 360;

  return values;
}
