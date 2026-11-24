import type { PeerbotsEmotion } from "../types/face";
import type {
  FacsOverrides,
  PeerbotsConversationState,
  VizijStandardExpression,
} from "../types/profile";

export interface FacePose {
  eyeHeight: number;
  eyeWidth: number;
  topLid: number;
  bottomLid: number;
  lidTilt: number;
  browY: number;
  browTilt: number;
  browArch: number;
  mouthCurve: number;
  mouthWidth: number;
  mouthOpen: number;
  pupilScale: number;
  cheekAlpha: number;
}

export const NEUTRAL_POSE: FacePose = {
  eyeHeight: 1.0,
  eyeWidth: 1.0,
  topLid: 0.0,
  bottomLid: 0.0,
  lidTilt: 0.0,
  browY: 0.0,
  browTilt: 0.0,
  browArch: 0.15,
  mouthCurve: 0.22,
  mouthWidth: 0.9,
  mouthOpen: 0.0,
  pupilScale: 1.0,
  cheekAlpha: 0.45,
};

export const EMOTION_POSES: Record<PeerbotsEmotion, FacePose> = {
  Neutral: { ...NEUTRAL_POSE },
  Happy: {
    eyeHeight: 0.85,
    eyeWidth: 1.06,
    topLid: 0.0,
    bottomLid: 0.48,
    lidTilt: 0.0,
    browY: -0.22,
    browTilt: -0.1,
    browArch: 0.38,
    mouthCurve: 0.85,
    mouthWidth: 1.12,
    mouthOpen: 0.15,
    pupilScale: 1.08,
    cheekAlpha: 0.85,
  },
  Sad: {
    eyeHeight: 0.88,
    eyeWidth: 0.96,
    topLid: 0.34,
    bottomLid: 0.08,
    lidTilt: -0.45,
    browY: 0.05,
    browTilt: -0.45,
    browArch: 0.1,
    mouthCurve: -0.58,
    mouthWidth: 0.78,
    mouthOpen: 0.0,
    pupilScale: 0.95,
    cheekAlpha: 0.2,
  },
  Surprised: {
    eyeHeight: 1.24,
    eyeWidth: 1.12,
    topLid: 0.0,
    bottomLid: 0.0,
    lidTilt: 0.0,
    browY: -0.52,
    browTilt: 0.05,
    browArch: 0.55,
    mouthCurve: 0.0,
    mouthWidth: 0.56,
    mouthOpen: 0.72,
    pupilScale: 0.78,
    cheekAlpha: 0.3,
  },
  Concerned: {
    eyeHeight: 0.78,
    eyeWidth: 1.0,
    topLid: 0.38,
    bottomLid: 0.12,
    lidTilt: 0.22,
    browY: 0.18,
    browTilt: 0.32,
    browArch: -0.15,
    mouthCurve: -0.28,
    mouthWidth: 0.84,
    mouthOpen: 0.0,
    pupilScale: 0.92,
    cheekAlpha: 0.18,
  },
  Sleepy: {
    eyeHeight: 0.36,
    eyeWidth: 1.04,
    topLid: 0.72,
    bottomLid: 0.12,
    lidTilt: -0.12,
    browY: 0.24,
    browTilt: -0.18,
    browArch: 0.05,
    mouthCurve: 0.06,
    mouthWidth: 0.58,
    mouthOpen: 0.08,
    pupilScale: 0.85,
    cheekAlpha: 0.35,
  },
};

export const EXTENDED_EXPRESSION_POSES: Partial<
  Record<VizijStandardExpression, FacePose>
> = {
  neutral: EMOTION_POSES.Neutral,
  happy: EMOTION_POSES.Happy,
  sad: EMOTION_POSES.Sad,
  surprised: EMOTION_POSES.Surprised,
  concerned: EMOTION_POSES.Concerned,
  sleepy: EMOTION_POSES.Sleepy,
  excited: {
    ...EMOTION_POSES.Happy,
    eyeHeight: 1.12,
    bottomLid: 0.32,
    browY: -0.4,
    mouthOpen: 0.45,
    cheekAlpha: 0.95,
  },
  amazed: {
    ...EMOTION_POSES.Surprised,
    mouthCurve: 0.35,
    mouthOpen: 0.65,
    pupilScale: 1.12,
  },
  confused: {
    ...EMOTION_POSES.Concerned,
    eyeHeight: 0.95,
    topLid: 0.18,
    lidTilt: 0.35,
    browTilt: 0.42,
    mouthCurve: -0.18,
    mouthWidth: 0.7,
  },
  skeptical: {
    ...NEUTRAL_POSE,
    eyeHeight: 0.82,
    topLid: 0.32,
    lidTilt: 0.28,
    browTilt: 0.35,
    mouthCurve: -0.1,
    mouthWidth: 0.78,
  },
  bored: {
    ...EMOTION_POSES.Sleepy,
    eyeHeight: 0.65,
    topLid: 0.48,
    lidTilt: 0.0,
    mouthCurve: -0.05,
    mouthOpen: 0.0,
  },
  tired: {
    ...EMOTION_POSES.Sleepy,
    topLid: 0.62,
  },
  asleep: {
    ...EMOTION_POSES.Sleepy,
    eyeHeight: 0.14,
    topLid: 0.95,
    mouthOpen: 0.0,
  },
  angry: {
    ...EMOTION_POSES.Concerned,
    eyeHeight: 0.74,
    topLid: 0.45,
    lidTilt: 0.55,
    browY: 0.32,
    browTilt: 0.62,
    browArch: -0.25,
    mouthCurve: -0.5,
  },
};

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export interface ResolvePoseOptions {
  extendedExpression?: VizijStandardExpression | null;
  expressivity?: number;
  conversationState?: PeerbotsConversationState;
  facsOverrides?: FacsOverrides;
}

/**
 * Computes the target 2D `FacePose` from the canonical `vizij-face` + `peerbots-face`
 * controls (emotion/extended expression, expressivity, conversation cues, and FACS subset).
 */
export function resolveTargetPose(
  emotion: PeerbotsEmotion,
  options: ResolvePoseOptions = {},
): FacePose {
  const {
    extendedExpression = null,
    expressivity = 1,
    conversationState = "idle",
    facsOverrides,
  } = options;

  const base =
    (extendedExpression && EXTENDED_EXPRESSION_POSES[extendedExpression]) ||
    EMOTION_POSES[emotion] ||
    NEUTRAL_POSE;

  const exp = clamp(Number.isNaN(expressivity) ? 1 : expressivity, 0, 1);

  const pose: FacePose = {
    eyeHeight: lerp(NEUTRAL_POSE.eyeHeight, base.eyeHeight, exp),
    eyeWidth: lerp(NEUTRAL_POSE.eyeWidth, base.eyeWidth, exp),
    topLid: lerp(NEUTRAL_POSE.topLid, base.topLid, exp),
    bottomLid: lerp(NEUTRAL_POSE.bottomLid, base.bottomLid, exp),
    lidTilt: lerp(NEUTRAL_POSE.lidTilt, base.lidTilt, exp),
    browY: lerp(NEUTRAL_POSE.browY, base.browY, exp),
    browTilt: lerp(NEUTRAL_POSE.browTilt, base.browTilt, exp),
    browArch: lerp(NEUTRAL_POSE.browArch, base.browArch, exp),
    mouthCurve: lerp(NEUTRAL_POSE.mouthCurve, base.mouthCurve, exp),
    mouthWidth: lerp(NEUTRAL_POSE.mouthWidth, base.mouthWidth, exp),
    mouthOpen: lerp(NEUTRAL_POSE.mouthOpen, base.mouthOpen, exp),
    pupilScale: lerp(NEUTRAL_POSE.pupilScale, base.pupilScale, exp),
    cheekAlpha: lerp(NEUTRAL_POSE.cheekAlpha, base.cheekAlpha, exp),
  };

  // Subtle HRI conversational cues
  if (conversationState === "listening") {
    pose.eyeHeight = clamp(pose.eyeHeight + 0.06, 0.1, 1.35);
    pose.browY = clamp(pose.browY - 0.1, -0.7, 0.6);
  } else if (conversationState === "thinking") {
    pose.topLid = clamp(pose.topLid + 0.12, 0, 1);
    pose.browArch = clamp(pose.browArch + 0.12, -0.4, 0.7);
  }

  // Optional FACS muscle-tier overrides (subset mapped cleanly to 2D vector rig)
  if (facsOverrides) {
    const browInnerUp = facsOverrides.brow_inner_up ?? 0;
    const browDown =
      ((facsOverrides.brow_down_left ?? 0) +
        (facsOverrides.brow_down_right ?? 0)) /
      2;
    const eyeWide =
      ((facsOverrides.eye_wide_left ?? 0) +
        (facsOverrides.eye_wide_right ?? 0)) /
      2;
    const eyeSquint =
      ((facsOverrides.eye_squint_left ?? 0) +
        (facsOverrides.eye_squint_right ?? 0)) /
      2;
    const cheekRaise =
      ((facsOverrides.cheek_raise_left ?? 0) +
        (facsOverrides.cheek_raise_right ?? 0)) /
      2;
    const smile =
      ((facsOverrides.mouth_smile_left ?? 0) +
        (facsOverrides.mouth_smile_right ?? 0)) /
      2;
    const frown =
      ((facsOverrides.mouth_frown_left ?? 0) +
        (facsOverrides.mouth_frown_right ?? 0)) /
      2;
    const jawOpen = facsOverrides.jaw_open ?? 0;

    pose.browY = clamp(pose.browY - browInnerUp * 0.4 + browDown * 0.4, -0.7, 0.6);
    pose.browTilt = clamp(pose.browTilt - browInnerUp * 0.35 + browDown * 0.45, -0.8, 0.8);
    pose.eyeHeight = clamp(pose.eyeHeight + eyeWide * 0.25 - eyeSquint * 0.2, 0.1, 1.4);
    pose.bottomLid = clamp(pose.bottomLid + eyeSquint * 0.35 + cheekRaise * 0.3, 0, 0.9);
    pose.cheekAlpha = clamp(pose.cheekAlpha + cheekRaise * 0.45, 0, 1);
    pose.mouthCurve = clamp(pose.mouthCurve + smile * 0.7 - frown * 0.7, -1, 1);
    pose.mouthOpen = clamp(Math.max(pose.mouthOpen, jawOpen), 0, 1);
  }

  return pose;
}

/**
 * Frame-rate-independent exponential smoothing between `current` and `target` poses.
 */
export function stepFacePose(
  current: FacePose,
  target: FacePose,
  dtSeconds: number,
  speed: number = 9,
): FacePose {
  const alpha = dtSeconds <= 0 ? 0 : 1 - Math.exp(-speed * dtSeconds);
  return {
    eyeHeight: lerp(current.eyeHeight, target.eyeHeight, alpha),
    eyeWidth: lerp(current.eyeWidth, target.eyeWidth, alpha),
    topLid: lerp(current.topLid, target.topLid, alpha),
    bottomLid: lerp(current.bottomLid, target.bottomLid, alpha),
    lidTilt: lerp(current.lidTilt, target.lidTilt, alpha),
    browY: lerp(current.browY, target.browY, alpha),
    browTilt: lerp(current.browTilt, target.browTilt, alpha),
    browArch: lerp(current.browArch, target.browArch, alpha),
    mouthCurve: lerp(current.mouthCurve, target.mouthCurve, alpha),
    mouthWidth: lerp(current.mouthWidth, target.mouthWidth, alpha),
    mouthOpen: lerp(current.mouthOpen, target.mouthOpen, alpha),
    pupilScale: lerp(current.pupilScale, target.pupilScale, alpha),
    cheekAlpha: lerp(current.cheekAlpha, target.cheekAlpha, alpha),
  };
}

/**
 * Computes subtle HRI gaze aversion when thinking (and no active user gaze target).
 */
export function resolveConversationGazeOffset(
  conversationState: PeerbotsConversationState,
  timeSeconds: number,
): { x: number; y: number } {
  if (conversationState === "thinking") {
    return {
      x: 0.32 + 0.08 * Math.sin(timeSeconds * 0.9),
      y: -0.22 + 0.05 * Math.cos(timeSeconds * 0.7),
    };
  }
  return { x: 0, y: 0 };
}
