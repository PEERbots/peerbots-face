import type { PeerbotsEmotion } from "../types/face";
import type { FacsOverrides, VizijStandardExpression } from "../types/profile";

/**
 * Eye-focused 2D parametric pose vector (mouth stays neutral and only animates with speech).
 */
export interface FacePose {
  eyeHeight: number;
  eyeWidth: number;
  topLid: number;
  bottomLid: number;
  lidTilt: number;
  /** Smooth upward crescent arch deformation for classic Hugo Happy eye & highlights (0 = none, 1 = full). */
  happyArc: number;
  /** Bottom-taper teardrop/egg morph for classic Hugo Surprised eye & highlights (0 = oval, 1 = full). */
  bottomTaper: number;
  /** Smooth organic melting/drooping almond deformation for classic Hugo Sad eye & highlights (0 = none, 1 = full). */
  sadDroop: number;
  /** Wide cat-eye upper-lid squint deformation for classic Hugo Concerned eye & highlights (0 = none, 1 = full). */
  concernedSquint: number;
  /** Thick glossy curved crescent sleep eye morph (0 = open/normal, 1 = classic curved sleepy crescent). */
  sleepyArc: number;
  browY: number;
  browTilt: number;
  browArch: number;
  pupilScale: number;
  cheekAlpha: number;
}

export const NEUTRAL_POSE: FacePose = {
  eyeHeight: 1.0,
  eyeWidth: 1.0,
  topLid: 0.0,
  bottomLid: 0.0,
  lidTilt: 0.0,
  happyArc: 0.0,
  bottomTaper: 0.0,
  sadDroop: 0.0,
  concernedSquint: 0.0,
  sleepyArc: 0.0,
  browY: 0.0,
  browTilt: 0.0,
  browArch: 0.15,
  pupilScale: 1.0,
  cheekAlpha: 0.85,
};

export const EMOTION_POSES: Record<PeerbotsEmotion, FacePose> = {
  Neutral: { ...NEUTRAL_POSE },
  Happy: {
    eyeHeight: 0.92,
    eyeWidth: 1.14,
    topLid: 0.0,
    bottomLid: 0.44,
    lidTilt: 0.0,
    happyArc: 1.0,
    bottomTaper: 0.0,
    sadDroop: 0.0,
    concernedSquint: 0.0,
    sleepyArc: 0.0,
    browY: -0.04,
    browTilt: 0.0,
    browArch: 0.15,
    pupilScale: 1.04,
    cheekAlpha: 0.9,
  },
  Sad: {
    eyeHeight: 1.12,
    eyeWidth: 1.18,
    topLid: 0.0,
    bottomLid: 0.0,
    lidTilt: -0.15,
    happyArc: 0.0,
    bottomTaper: 0.0,
    sadDroop: 1.0,
    concernedSquint: 0.0,
    sleepyArc: 0.0,
    browY: 0.0,
    browTilt: 0.0,
    browArch: 0.15,
    pupilScale: 1.02,
    cheekAlpha: 0.85,
  },
  Surprised: {
    eyeHeight: 1.62,
    eyeWidth: 1.22,
    topLid: 0.0,
    bottomLid: 0.0,
    lidTilt: 0.0,
    happyArc: 0.0,
    bottomTaper: 1.0,
    sadDroop: 0.0,
    concernedSquint: 0.0,
    sleepyArc: 0.0,
    browY: -0.55,
    browTilt: 0.0,
    browArch: 0.25,
    pupilScale: 1.14,
    cheekAlpha: 0.85,
  },
  Concerned: {
    eyeHeight: 0.9,
    eyeWidth: 1.44,
    topLid: 0.42,
    bottomLid: 0.0,
    lidTilt: 0.0,
    happyArc: 0.0,
    bottomTaper: 0.0,
    sadDroop: 0.0,
    concernedSquint: 1.0,
    sleepyArc: 0.0,
    browY: 0.0,
    browTilt: 0.0,
    browArch: 0.15,
    pupilScale: 0.94,
    cheekAlpha: 0.85,
  },
  Sleepy: {
    eyeHeight: 0.36,
    eyeWidth: 1.15,
    topLid: 0.72,
    bottomLid: 0.08,
    lidTilt: 0.0,
    happyArc: 0.0,
    bottomTaper: 0.0,
    sadDroop: 0.0,
    concernedSquint: 0.0,
    sleepyArc: 1.0,
    browY: 0.0,
    browTilt: 0.0,
    browArch: 0.15,
    pupilScale: 0.85,
    cheekAlpha: 0.85,
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
    bottomLid: 0.35,
    happyArc: 0.82,
    browY: -0.35,
    cheekAlpha: 0.95,
  },
  amazed: {
    ...EMOTION_POSES.Surprised,
    pupilScale: 1.12,
  },
  confused: {
    ...EMOTION_POSES.Concerned,
    eyeHeight: 0.95,
    topLid: 0.2,
    concernedSquint: 0.65,
    lidTilt: 0.35,
    browTilt: 0.42,
  },
  skeptical: {
    ...NEUTRAL_POSE,
    eyeHeight: 0.82,
    topLid: 0.34,
    concernedSquint: 0.55,
    lidTilt: 0.28,
    browTilt: 0.35,
  },
  bored: {
    ...EMOTION_POSES.Sleepy,
    eyeHeight: 0.65,
    topLid: 0.5,
    concernedSquint: 0.7,
    sleepyArc: 0.0,
  },
  tired: {
    ...EMOTION_POSES.Sleepy,
    topLid: 0.62,
    sleepyArc: 0.55,
  },
  asleep: {
    ...EMOTION_POSES.Sleepy,
    eyeHeight: 0.16,
    topLid: 0.92,
    sleepyArc: 1.0,
  },
  angry: {
    ...EMOTION_POSES.Concerned,
    eyeHeight: 0.74,
    topLid: 0.45,
    concernedSquint: 0.85,
    lidTilt: 0.55,
    browY: 0.32,
    browTilt: 0.62,
    browArch: -0.25,
  },
};

function lerp(a: number, b: number, t: number): number {
  if (t <= 0) return a;
  if (t >= 1) return b;
  return a + (b - a) * t;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export interface ResolvePoseOptions {
  extendedExpression?: VizijStandardExpression | null;
  expressivity?: number;
  facsOverrides?: FacsOverrides;
}

/**
 * Computes the target 2D eye `FacePose` from the canonical emotion/extended expression,
 * expressivity, and optional FACS overrides.
 */
export function resolveTargetPose(
  emotion: PeerbotsEmotion,
  options: ResolvePoseOptions = {},
): FacePose {
  const {
    extendedExpression = null,
    expressivity = 1,
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
    happyArc: lerp(NEUTRAL_POSE.happyArc, base.happyArc, exp),
    bottomTaper: lerp(NEUTRAL_POSE.bottomTaper, base.bottomTaper, exp),
    sadDroop: lerp(NEUTRAL_POSE.sadDroop, base.sadDroop, exp),
    concernedSquint: lerp(NEUTRAL_POSE.concernedSquint, base.concernedSquint, exp),
    sleepyArc: lerp(NEUTRAL_POSE.sleepyArc, base.sleepyArc, exp),
    browY: lerp(NEUTRAL_POSE.browY, base.browY, exp),
    browTilt: lerp(NEUTRAL_POSE.browTilt, base.browTilt, exp),
    browArch: lerp(NEUTRAL_POSE.browArch, base.browArch, exp),
    pupilScale: lerp(NEUTRAL_POSE.pupilScale, base.pupilScale, exp),
    cheekAlpha: lerp(NEUTRAL_POSE.cheekAlpha, base.cheekAlpha, exp),
  };

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

    pose.browY = clamp(pose.browY - browInnerUp * 0.4 + browDown * 0.4, -0.7, 0.6);
    pose.browTilt = clamp(pose.browTilt - browInnerUp * 0.35 + browDown * 0.45, -0.8, 0.8);
    pose.eyeHeight = clamp(pose.eyeHeight + eyeWide * 0.25 - eyeSquint * 0.2, 0.1, 1.7);
    pose.bottomLid = clamp(pose.bottomLid + eyeSquint * 0.35 + cheekRaise * 0.3, 0, 0.9);
    pose.happyArc = clamp(pose.happyArc + cheekRaise * 0.45, 0, 1);
    pose.concernedSquint = clamp(pose.concernedSquint + eyeSquint * 0.45, 0, 1);
    pose.cheekAlpha = clamp(pose.cheekAlpha + cheekRaise * 0.45, 0, 1);
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
    happyArc: lerp(current.happyArc, target.happyArc, alpha),
    bottomTaper: lerp(current.bottomTaper, target.bottomTaper, alpha),
    sadDroop: lerp(current.sadDroop, target.sadDroop, alpha),
    concernedSquint: lerp(current.concernedSquint, target.concernedSquint, alpha),
    sleepyArc: lerp(current.sleepyArc, target.sleepyArc, alpha),
    browY: lerp(current.browY, target.browY, alpha),
    browTilt: lerp(current.browTilt, target.browTilt, alpha),
    browArch: lerp(current.browArch, target.browArch, alpha),
    pupilScale: lerp(current.pupilScale, target.pupilScale, alpha),
    cheekAlpha: lerp(current.cheekAlpha, target.cheekAlpha, alpha),
  };
}
