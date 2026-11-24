import type { Graphics } from "pixi.js";
import type { FacePose } from "../../helpers/face_poses";
import type {
  PixiCheekStyle,
  PixiColorRole,
  PixiEyebrowStyle,
  PixiMouthShape,
  VectorFaceStyleId,
} from "../../types/face";

export const DARK_VISOR_HEX = "#0F172A";

export interface VectorEyeDrawParams {
  graphics: Graphics;
  style: VectorFaceStyleId;
  pose: FacePose;
  scale: number;
  breatheLeft: number;
  breatheRight: number;
  blink: number;
  gazeX: number;
  gazeY: number;
  bgColor: string;
  themeColor: string;
  colorRole: PixiColorRole;
  showEyebrows: boolean;
  showCheeks: boolean;
  /** Optional explicit eyebrow part style; falls back to the eye style's default when omitted. */
  eyebrowStyle?: PixiEyebrowStyle | null;
  /** Optional explicit cheek part style; falls back to the eye style's default when omitted. */
  cheekStyle?: PixiCheekStyle | null;
}

export interface VectorMouthDrawParams {
  graphics: Graphics;
  style: VectorFaceStyleId;
  /** Explicit composable mouth shape; falls back to the eye style's default mouth when omitted. */
  mouthShape?: PixiMouthShape;
  scale: number;
  talking: boolean;
  talkingScale: number;
  talkingTime: number;
  themeColor: string;
  colorRole: PixiColorRole;
}

/**
 * Resolves the background color for a Pixi avatar given its `colorRole`
 * (`"background"` uses the single Peerbots color; `"accent"` uses a sleek dark visor).
 */
export function resolveAvatarBackgroundHex(
  themeHex: string,
  colorRole: PixiColorRole = "background",
): string {
  if (colorRole === "accent") {
    return DARK_VISOR_HEX;
  }
  return themeHex;
}

/**
 * Resolves the primary foreground/luminous ink color for a vector face.
 */
export function resolveVectorInkHex(
  themeHex: string,
  style: VectorFaceStyleId,
  colorRole: PixiColorRole = "background",
): string {
  const normalized = themeHex.toLowerCase();
  if (colorRole === "accent") {
    if (normalized === "#000000" || normalized === "#111111" || normalized === "#0f172a") {
      if (style === "pixel") return "#FBBF24";
      return "#38BDF8";
    }
    return themeHex;
  }
  if (normalized === "#000000") {
    return "#F8FAFC";
  }
  if (style === "hugo") return "#000000";
  if (style === "pebble") return "#1B4332";
  if (style === "slate") return "#1E293B";
  return "#111827";
}

/**
 * Traces a true parametric eye silhouette (superellipse deformed by upper/lower
 * eyelids, lid tilt, and optional teardrop bottom taper) with 100% transparent
 * exterior — never painting opaque background circles over FaceBackground's glow.
 */
function traceEyeContour(
  g: Graphics,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  topLid: number,
  bottomLid: number,
  lidTilt: number,
  isLeft: boolean,
  superellipsePower: number = 2,
  bottomTaper: number = 0,
  sadDroop: number = 0,
): { visibleTop: number; visibleBottom: number } {
  const segments = 56;
  const sign = isLeft ? 1 : -1;
  const tiltSlope = Math.tan(lidTilt * 0.48 * sign);
  const exp = 2 / superellipsePower;

  let minY = Infinity;
  let maxY = -Infinity;

  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);

    let lx = rx * Math.sign(cosT) * Math.pow(Math.abs(cosT), exp);
    let ly = ry * Math.sign(sinT) * Math.pow(Math.abs(sinT), exp);

    // Smooth C1-continuous teardrop/egg taper (classic Hugo Surprised eye — zero equator kink)
    if (bottomTaper > 0.005) {
      const tDown = (sinT + 1) * 0.5; // 0 at top, 1 at bottom
      lx *= 1 + bottomTaper * (0.1 - 0.68 * tDown * tDown);
      ly -= bottomTaper * ry * 0.08 * (1 - tDown);
    }

    // Smooth organic melting/drooping almond (classic Hugo Sad eye — tall inner-top, drooping outer-bottom)
    if (sadDroop > 0.005) {
      // u = +1 on inner (nose) side, -1 on outer side
      const u = cosT * sign;
      const outerWeight = Math.pow((1 - u) * 0.5, 1.55);
      const topWeight = Math.max(0, -sinT);
      const botWeight = Math.max(0, sinT);
      // Outer upper contour droops gently downward; inner peak stays tall and rounded
      ly += sadDroop * ry * (1.05 * outerWeight * topWeight - 0.14 * Math.max(0, u) * topWeight);
      // Shift inner-top slightly toward nose and widen outer-bottom lobe softly
      lx += sadDroop * rx * sign * (0.2 * topWeight - 0.14 * outerWeight * botWeight);
    }

    const normX = Math.max(-1, Math.min(1, lx / Math.max(1, rx)));

    // Upper eyelid curve (gently bowed + slight outer lift for classic Concerned squint)
    const concernedBow =
      topLid > 0.005
        ? -ry * 0.09 * Math.cos(normX * Math.PI) - ry * 0.06 * Math.pow(Math.abs(normX), 2.2)
        : 0;
    const topCutY =
      topLid > 0.005
        ? -ry + ry * 1.68 * topLid + tiltSlope * lx + concernedBow
        : -ry * 1.2;

    // Lower eyelid upward rounded arch (classic Happy — softly rounded bottom corners)
    const archFactor = Math.pow(Math.max(0, Math.cos(normX * Math.PI * 0.45)), 1.65);
    const botCutY =
      bottomLid > 0.005
        ? ry - bottomLid * ry * 1.32 * archFactor
        : ry * 1.2;

    if (topCutY >= botCutY) {
      ly = (topCutY + botCutY) * 0.5;
    } else {
      ly = Math.max(topCutY, Math.min(botCutY, ly));
    }

    if (ly < minY) minY = ly;
    if (ly > maxY) maxY = ly;

    const px = cx + lx;
    const py = cy + ly;
    if (i === 0) {
      g.moveTo(px, py);
    } else {
      g.lineTo(px, py);
    }
  }
  g.closePath();

  return {
    visibleTop: Number.isFinite(minY) ? minY : -ry,
    visibleBottom: Number.isFinite(maxY) ? maxY : ry,
  };
}

function drawCurvedBrow(
  g: Graphics,
  cx: number,
  cy: number,
  halfWidth: number,
  arch: number,
  tilt: number,
  isLeft: boolean,
  strokeWidth: number,
  color: string,
  straight: boolean = false,
): void {
  const sign = isLeft ? 1 : -1;
  const angle = tilt * 0.42 * sign;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  const rotatePt = (lx: number, ly: number) => ({
    x: cx + lx * cos - ly * sin,
    y: cy + lx * sin + ly * cos,
  });

  const p0 = rotatePt(-halfWidth, straight ? 0 : halfWidth * 0.25 * arch);
  const ctrl = rotatePt(0, straight ? 0 : -halfWidth * 0.45 * arch);
  const p1 = rotatePt(halfWidth, straight ? 0 : halfWidth * 0.25 * arch);

  g.moveTo(p0.x, p0.y);
  g.quadraticCurveTo(ctrl.x, ctrl.y, p1.x, p1.y);
  g.stroke({
    width: strokeWidth,
    color,
    cap: straight ? "butt" : "round",
    join: "round",
  });
}

/**
 * Unified C-infinity unit-disk warp for classic Hugo eyes AND embedded highlights.
 * Because both the eye silhouette and the twin white highlights pass through the same
 * diffeomorphism of the unit disk, highlights smoothly curve, tilt, stretch, and squash
 * across all 6 canonical emotions (Neutral, Happy, Sad, Surprised, Concerned, Sleepy)
 * without ever clipping outside the eye boundary.
 */
function deformHugoPoint(
  nx: number,
  ny: number,
  pose: FacePose,
  isLeft: boolean,
): { x: number; y: number } {
  const sign = isLeft ? 1 : -1;
  let x = nx;
  let y = ny;

  // 1. Happy: rounded bottom crescent arch + subtle upper lift
  if (pose.happyArc > 0.001) {
    const tBot = (ny + 1) * 0.5;
    const x2 = nx * nx;
    const arch = Math.exp(-3.104 * x2);
    const xH = nx * (1.15 - 0.0196 * tBot);
    const yH =
      ny * 0.78 -
      0.22 -
      0.4006 * arch * (0.3 + 0.7 * tBot) +
      0.4694 * x2 * Math.pow(tBot, 1.4);
    x += (xH - nx) * pose.happyArc;
    y += (yH - ny) * pose.happyArc;
  }

  // 2. Sad: tall inner-top peak, drooping outer slope, soft outer-bottom corner
  if (pose.sadDroop > 0.001) {
    const u = nx * sign; // +1 inner (nose), -1 outer
    const tTop = (1 - ny) * 0.5;
    const tBot = 1 - tTop;
    const outer = Math.max(0, (1 - u) * 0.5);
    const inner = Math.max(0, (1 + u) * 0.5);
    const uS =
      u * 1.0287 +
      0.027 * tTop * (1 - 0.35 * u * u) -
      0.233 * Math.pow(outer, 1.3) * tBot +
      0.2245 * Math.pow(inner, 1.5) * tBot;
    const peak = Math.exp(-3.486 * (u - 0.2685) * (u - 0.2685));
    const yS =
      ny * 1.062 -
      0.06 +
      tTop * (1.245 * Math.pow(outer, 1.79) - 0.354 * peak);
    const xS = uS * sign;
    x += (xS - nx) * pose.sadDroop;
    y += (yS - ny) * pose.sadDroop;
  }

  // 3. Surprised: smooth tall teardrop/egg with upper dome lift
  if (pose.bottomTaper > 0.001) {
    const tBot = (ny + 1) * 0.5;
    const xP = nx * (1.3806 - 0.4203 * Math.pow(tBot, 1.7288));
    const yP = ny * 1.7826 - 0.2506 - 0.1727 * nx * nx * tBot;
    x += (xP - nx) * pose.bottomTaper;
    y += (yP - ny) * pose.bottomTaper;
  }

  // 4. Concerned: wide cat-eye upper lid with crisp upturned tips & rounded lower bowl
  if (pose.concernedSquint > 0.001) {
    const tTop = (1 - ny) * 0.5;
    const x2 = nx * nx;
    const xC =
      nx * (1.03 + 0.48 * Math.pow(tTop, 1.09) + 0.42 * x2 * tTop * tTop);
    const yC =
      ny * 0.685 +
      0.27 -
      0.42 * (x2 * x2) * Math.pow(tTop, 1.15) +
      0.01 * (1 - x2) * tTop;
    x += (xC - nx) * pose.concernedSquint;
    y += (yC - ny) * pose.concernedSquint;
  }

  // 5. Sleepy: glossy downward-curving U-crescent with embedded specular streaks
  if (pose.sleepyArc > 0.001) {
    const x2 = nx * nx;
    const xSl = nx * 1.135;
    const curveY = 0.042 - 0.36 * x2 - 0.16 * x2 * x2;
    const ySl = curveY + ny * 0.092 * (1 + 0.16 * x2);
    x += (xSl - nx) * pose.sleepyArc;
    y += (ySl - ny) * pose.sleepyArc;
  }

  // Subtle lid-tilt shear for extended expressions (angry / confused / skeptical)
  if (Math.abs(pose.lidTilt) > 0.01 && pose.sadDroop < 0.5) {
    const tTop = (1 - ny) * 0.5;
    y += pose.lidTilt * 0.32 * nx * sign * tTop;
  }

  return { x, y };
}

/**
 * Traces a circle `(centerX, centerY, radius)` inside Hugo's unit disk through
 * `deformHugoPoint`, scaling by `baseR` and applying `blink` vertically.
 */
function traceHugoWarpedCircle(
  g: Graphics,
  cx: number,
  cy: number,
  baseR: number,
  blink: number,
  pose: FacePose,
  isLeft: boolean,
  unitCx: number,
  unitCy: number,
  unitR: number,
  segments: number,
): void {
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const nx = unitCx + unitR * Math.cos(theta);
    const ny = unitCy + unitR * Math.sin(theta);
    const pt = deformHugoPoint(nx, ny, pose, isLeft);
    const px = cx + pt.x * baseR;
    const py = cy + pt.y * baseR * blink;
    if (i === 0) {
      g.moveTo(px, py);
    } else {
      g.lineTo(px, py);
    }
  }
  g.closePath();
}

/**
 * Resolves the effective cheek style for a vector face, falling back to the
 * eye style's default when no explicit `cheekStyle` is supplied.
 */
export function resolveCheekStyle(
  style: VectorFaceStyleId,
  explicit?: PixiCheekStyle | null,
): PixiCheekStyle | null {
  if (explicit !== undefined) return explicit;
  if (style === "hugo") return "coralOval";
  if (style === "mochi") return "pinkBlush";
  return null;
}

/**
 * Resolves the effective eyebrow style for a vector face, falling back to the
 * eye style's default when omitted or set to the legacy `"vector"` sentinel.
 */
export function resolveEyebrowStyle(
  style: VectorFaceStyleId,
  explicit?: PixiEyebrowStyle | null,
): Exclude<PixiEyebrowStyle, "vector"> | null {
  if (explicit === null) return null;
  if (explicit !== undefined && explicit !== "vector") return explicit;
  if (style === "hugo") return "delicateArch";
  if (style === "pebble") return "softArch";
  if (style === "orbit") return "thickArch";
  if (style === "slate") return "flatBar";
  return null;
}

/**
 * Resolves the effective mouth shape for a vector face, falling back to the
 * eye style's default mouth when no explicit `mouthShape` is supplied.
 */
export function resolveMouthShape(
  style: VectorFaceStyleId,
  explicit?: PixiMouthShape,
): PixiMouthShape {
  if (explicit !== undefined) return explicit;
  switch (style) {
    case "hugo":
      return "Hugo";
    case "dash":
      return "Equalizer";
    case "pixel":
      return "PixelMatrix";
    case "mochi":
      return "Cat";
    case "slate":
      return "Capsule";
    case "orbit":
      return "Arc";
    case "pebble":
      return "SoftCurve";
  }
}

/**
 * Renders a single composable cheek part relative to the eye center `(cx, cy)`.
 */
export function drawVectorCheek(
  g: Graphics,
  cheekStyle: PixiCheekStyle,
  cx: number,
  cy: number,
  side: -1 | 1,
  breathe: number,
  scale: number,
  pose: FacePose,
): void {
  if (pose.cheekAlpha <= 0.02) return;
  if (cheekStyle === "coralOval") {
    g.ellipse(cx, cy + 150 * scale, 41 * breathe * scale, 20 * breathe * scale);
    g.fill({ color: "#FFA39E", alpha: Math.min(1, pose.cheekAlpha * 1.25) });
  } else if (cheekStyle === "pinkBlush") {
    g.ellipse(cx + side * 38 * scale, cy + 102 * scale, 56 * scale, 26 * scale);
    g.fill({ color: "#FB7185", alpha: pose.cheekAlpha * 0.6 });
  } else {
    g.ellipse(
      cx + side * 24 * scale,
      cy + 118 * scale,
      48 * breathe * scale,
      22 * breathe * scale,
    );
    g.fill({ color: "#FDA4AF", alpha: Math.min(0.85, pose.cheekAlpha * 0.85) });
  }
}

/**
 * Renders a single composable eyebrow part relative to the eye anchor `(bx, by)`.
 */
export function drawVectorEyebrow(
  g: Graphics,
  eyebrowStyle: Exclude<PixiEyebrowStyle, "vector">,
  bx: number,
  by: number,
  isLeft: boolean,
  breathe: number,
  scale: number,
  pose: FacePose,
  ink: string,
  colorRole: PixiColorRole,
): void {
  if (eyebrowStyle === "delicateArch" || eyebrowStyle === "Hugo") {
    drawCurvedBrow(
      g,
      bx,
      by - 180 * scale + pose.browY * 24 * scale,
      37 * breathe * scale,
      1.15 + pose.browArch * 0.4,
      pose.browTilt * 0.35,
      isLeft,
      Math.max(1.5, 3.2 * scale),
      ink,
    );
  } else if (eyebrowStyle === "softArch") {
    drawCurvedBrow(
      g,
      bx,
      by - 148 * scale + pose.browY * 60 * scale,
      58 * scale,
      pose.browArch,
      pose.browTilt,
      isLeft,
      Math.max(5, 20 * scale),
      ink,
    );
  } else if (eyebrowStyle === "thickArch") {
    drawCurvedBrow(
      g,
      bx,
      by - 155 * scale + pose.browY * 60 * scale,
      72 * scale,
      pose.browArch * 0.4,
      pose.browTilt,
      isLeft,
      Math.max(5, 20 * scale),
      ink,
    );
  } else {
    drawCurvedBrow(
      g,
      bx,
      by - 120 * scale + pose.browY * 50 * scale,
      72 * scale,
      0,
      pose.browTilt * 0.8,
      isLeft,
      Math.max(4, 15 * scale),
      colorRole === "accent" ? ink : "#64748B",
      true,
    );
  }
}

/**
 * Renders both eyes, eyelids, highlights, and independently composed eyebrows and cheeks
 * for any Pixi vector face configuration.
 */
export function drawVectorEyes(params: VectorEyeDrawParams): void {
  const {
    graphics: g,
    style,
    pose,
    scale,
    breatheLeft,
    breatheRight,
    blink,
    gazeX,
    gazeY,
    themeColor,
    colorRole,
    showEyebrows,
    showCheeks,
    eyebrowStyle,
    cheekStyle,
  } = params;

  g.clear();

  const ink = resolveVectorInkHex(themeColor, style, colorRole);
  const resolvedCheek = showCheeks ? resolveCheekStyle(style, cheekStyle) : null;
  const resolvedBrow = showEyebrows ? resolveEyebrowStyle(style, eyebrowStyle) : null;
  const eyeSep = style === "hugo" ? 300 * scale : 270 * scale;
  const gx = gazeX * 40 * scale;
  const gy = gazeY * 30 * scale;
  const sides: readonly (-1 | 1)[] = [-1, 1];

  for (const side of sides) {
    const isLeft = side < 0;
    const breathe = isLeft ? breatheLeft : breatheRight;
    const cx = side * eyeSep + gx;
    const cy = gy;
    let browAnchorX = cx;
    let browAnchorY = cy;

    // Soft translucent blush styles render behind the eye silhouette
    if (resolvedCheek && resolvedCheek !== "coralOval") {
      drawVectorCheek(g, resolvedCheek, cx, cy, side, breathe, scale, pose);
    }

    if (style === "hugo") {
      // Faithful to classic Hugo PNGs: 95.5px base radius, 1.1 L/R scale ratio,
      // pure black eyes, unified unit-disk warp for eye silhouette + twin morphing highlights.
      const asym = isLeft ? 1.1 : 1.0;
      const baseR = 95.5 * breathe * asym * scale;
      const effBlink = Math.max(0.06, blink);

      traceHugoWarpedCircle(g, cx, cy, baseR, effBlink, pose, isLeft, 0, 0, 1, 64);
      g.fill({ color: ink });

      if (blink > 0.18) {
        // Subtle parallax gaze inside the unit disk so highlights stay strictly inside the eye
        const hlGazeX = Math.max(-0.06, Math.min(0.06, gazeX * 0.05));
        const hlGazeY = Math.max(-0.05, Math.min(0.05, gazeY * 0.04));

        // Primary upper-right highlight (morphs into curved bean / tall teardrop / wide oval / specular streak)
        traceHugoWarpedCircle(
          g,
          cx,
          cy,
          baseR,
          effBlink,
          pose,
          isLeft,
          0.295 + hlGazeX,
          -0.295 + hlGazeY,
          0.387,
          36,
        );
        g.fill({ color: "#FFFFFF" });

        // Secondary lower-left highlight (morphs into tilted sliver / soft oval / lower crescent streak)
        traceHugoWarpedCircle(
          g,
          cx,
          cy,
          baseR,
          effBlink,
          pose,
          isLeft,
          -0.391 + hlGazeX * 0.7,
          0.391 + hlGazeY * 0.7,
          0.19,
          28,
        );
        g.fill({ color: "#FFFFFF" });
      }
    } else if (style === "mochi") {
      if (pose.bottomLid > 0.32 && blink > 0.3) {
        const arcW = 68 * scale;
        const arcH = 42 * scale;
        g.moveTo(cx - arcW, cy + arcH * 0.4);
        g.quadraticCurveTo(cx, cy - arcH, cx + arcW, cy + arcH * 0.4);
        g.stroke({
          width: Math.max(5, 22 * scale),
          color: ink,
          cap: "round",
        });
      } else {
        const rx = 56 * pose.eyeWidth * breathe * scale;
        const ry = Math.max(8 * scale, 68 * pose.eyeHeight * breathe * blink * scale);
        const { visibleTop, visibleBottom } = traceEyeContour(
          g,
          cx,
          cy,
          rx,
          ry,
          pose.topLid,
          0,
          pose.lidTilt,
          isLeft,
          2,
        );
        g.fill({ color: ink });

        const apertureH = Math.max(0, visibleBottom - visibleTop);
        const apertureMidY = (visibleTop + visibleBottom) * 0.5;
        if (blink > 0.3 && apertureH > 22 * scale) {
          g.circle(
            cx + rx * 0.28,
            cy + apertureMidY - apertureH * 0.14,
            Math.min(16 * scale, apertureH * 0.25),
          );
          g.fill({ color: "#FFFFFF" });
        }
      }
    } else if (style === "pebble") {
      const rx = 82 * pose.eyeWidth * breathe * scale;
      const ry = Math.max(8 * scale, 97 * pose.eyeHeight * breathe * blink * scale);
      const { visibleTop, visibleBottom } = traceEyeContour(
        g,
        cx,
        cy,
        rx,
        ry,
        pose.topLid,
        pose.bottomLid,
        pose.lidTilt,
        isLeft,
        3.2,
      );
      g.fill({ color: ink });

      const apertureH = Math.max(0, visibleBottom - visibleTop);
      const apertureMidY = (visibleTop + visibleBottom) * 0.5;
      if (blink > 0.25 && apertureH > 26 * scale) {
        g.circle(
          cx + rx * 0.26 + gx * 0.12,
          cy + apertureMidY - apertureH * 0.12 + gy * 0.08,
          Math.min(22 * scale, apertureH * 0.24),
        );
        g.fill({ color: "#FFFFFF" });
      }
    } else if (style === "dash") {
      const rx = 90 * pose.eyeWidth * breathe * scale;
      const ry = Math.max(8 * scale, 86 * pose.eyeHeight * breathe * blink * scale);

      traceEyeContour(
        g,
        cx,
        cy,
        rx + 14 * scale,
        ry + 14 * scale,
        pose.topLid,
        pose.bottomLid,
        pose.lidTilt,
        isLeft,
        4.2,
      );
      g.fill({ color: ink, alpha: 0.2 });

      traceEyeContour(
        g,
        cx,
        cy,
        rx,
        ry,
        pose.topLid,
        pose.bottomLid,
        pose.lidTilt,
        isLeft,
        4.2,
      );
      g.fill({ color: ink });
    } else if (style === "orbit") {
      const eyeCenterX = side * eyeSep + gx * 0.45;
      const eyeCenterY = gy * 0.45;
      browAnchorX = eyeCenterX;
      browAnchorY = eyeCenterY;
      const rx = 112 * breathe * scale;
      const ry = Math.max(10 * scale, 112 * pose.eyeHeight * breathe * blink * scale);

      const { visibleTop, visibleBottom } = traceEyeContour(
        g,
        eyeCenterX,
        eyeCenterY,
        rx,
        ry,
        pose.topLid,
        pose.bottomLid,
        pose.lidTilt,
        isLeft,
        2,
      );
      g.fill({ color: "#FFFFFF" });
      g.stroke({ width: Math.max(3, 12 * scale), color: ink });

      const apertureH = Math.max(0, visibleBottom - visibleTop);
      const apertureMidY = (visibleTop + visibleBottom) * 0.5;
      if (blink > 0.2 && apertureH > 22 * scale) {
        const irisR = Math.min(rx * 0.56 * pose.pupilScale, apertureH * 0.44);
        const pupilR = Math.min(rx * 0.3 * pose.pupilScale, apertureH * 0.26);
        const clampedGazeY = Math.max(
          -apertureH * 0.12,
          Math.min(apertureH * 0.12, gy * 0.65),
        );
        g.ellipse(
          eyeCenterX + gx * 0.72,
          eyeCenterY + apertureMidY + clampedGazeY,
          irisR,
          irisR,
        );
        g.fill({ color: "#0284C7" });
        g.ellipse(
          eyeCenterX + gx * 0.8,
          eyeCenterY + apertureMidY + clampedGazeY,
          pupilR,
          pupilR,
        );
        g.fill({ color: ink });
      }
    } else if (style === "pixel") {
      const cols = 5;
      const rows = 5;
      const dot = 26 * scale;
      const gap = 36 * scale;
      const px = side * eyeSep + Math.round((gx * 0.6) / gap) * gap;
      const py = Math.round((gy * 0.6) / gap) * gap;
      const openRows = Math.max(1, 5 * pose.eyeHeight * blink);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const ny = (r - 2) / 2;
          const nx = (c - 2) / 2;
          const tiltOff = pose.lidTilt * 0.6 * nx * (isLeft ? 1 : -1);
          if (Math.abs(ny) > openRows / 5) continue;
          if (ny < -1 + pose.topLid * 1.9 + tiltOff) continue;
          if (ny > 1 - pose.bottomLid * 1.6) continue;
          const isCorner = Math.abs(nx) === 1 && Math.abs(ny) === 1;
          const x = px + (c - (cols - 1) / 2) * gap;
          const y = py + (r - (rows - 1) / 2) * gap;
          g.roundRect(x - dot / 2, y - dot / 2, dot, dot, dot * 0.25);
          g.fill({ color: ink, alpha: isCorner ? 0.35 : 1 });
        }
      }
    } else if (style === "slate") {
      const px = side * eyeSep + gx * 0.6;
      const py = gy * 0.6;
      browAnchorX = px;
      browAnchorY = py;
      const rx = 68 * pose.eyeWidth * breathe * scale;
      const ry = Math.max(8 * scale, 68 * pose.eyeHeight * breathe * blink * scale);

      traceEyeContour(
        g,
        px,
        py,
        rx,
        ry,
        pose.topLid,
        pose.bottomLid,
        pose.lidTilt,
        isLeft,
        2,
      );
      g.fill({ color: ink });
    }

    // Opaque coral-pink cheeks render AFTER eyes so Hugo's Surprised teardrop tucks cleanly behind the cheek
    if (resolvedCheek === "coralOval") {
      drawVectorCheek(g, resolvedCheek, cx, cy, side, breathe, scale, pose);
    }

    // Composable eyebrows (Hugo hides brows during Surprised when bottomTaper >= 0.65)
    if (resolvedBrow && !(style === "hugo" && pose.bottomTaper >= 0.65)) {
      drawVectorEyebrow(
        g,
        resolvedBrow,
        browAnchorX,
        browAnchorY,
        isLeft,
        breathe,
        scale,
        pose,
        ink,
        colorRole,
      );
    }
  }
}

/**
 * Renders a speech-only neutral mouth for any composable `PixiMouthShape`
 * (emotions are expressed solely by the eyes).
 */
export function drawVectorMouth(params: VectorMouthDrawParams): void {
  const {
    graphics: g,
    style,
    mouthShape,
    scale,
    talking,
    talkingScale,
    talkingTime,
    themeColor,
    colorRole,
  } = params;

  g.clear();

  const ink = resolveVectorInkHex(themeColor, style, colorRole);
  const shape = resolveMouthShape(style, mouthShape);
  const mouthY = 240 * scale;
  const talkAmt = talking ? talkingScale : 0;

  if (shape === "Hugo") {
    // Exact classic Hugo mouth geometry
    const width = 40 * scale;
    const smileDepth = 20 * scale;
    const openHeight = talking ? talkAmt * 30 * scale : 0;
    const topLipLift = talking ? talkAmt * 10 * scale : 0;

    g.moveTo(-width, mouthY);
    g.quadraticCurveTo(0, mouthY + smileDepth * 0.5 - topLipLift, width, mouthY);
    g.quadraticCurveTo(0, mouthY + smileDepth + openHeight * 1.5, -width, mouthY);
    g.fill({ color: ink });
    g.stroke({ color: ink, width: 2 });
    return;
  }

  if (shape === "Equalizer") {
    if (talkAmt > 0.08) {
      const bars = 7;
      for (let i = 0; i < bars; i++) {
        const bx = (i - (bars - 1) / 2) * 38 * scale;
        const env = 1 - Math.abs(i - (bars - 1) / 2) / 4;
        const bh =
          (14 + Math.abs(Math.sin(talkingTime * 0.015 + i * 1.3)) * talkAmt * 80 * env) *
          scale;
        g.moveTo(bx, mouthY - bh / 2);
        g.lineTo(bx, mouthY + bh / 2);
      }
      g.stroke({ width: Math.max(5, 18 * scale), color: ink, cap: "round" });
    } else {
      const halfW = 86 * scale;
      g.moveTo(-halfW, mouthY);
      g.quadraticCurveTo(0, mouthY + 18 * scale, halfW, mouthY);
      g.stroke({ width: Math.max(5, 18 * scale), color: ink, cap: "round" });
    }
    return;
  }

  if (shape === "PixelMatrix") {
    const cols = 9;
    const rows = 3;
    const dot = 22 * scale;
    const gap = 32 * scale;
    const ledOpen = talkAmt * 2.4;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const u = (c - 4) / 4;
        const curveRow = 1 + 0.25 * (1 - u * u) - 0.1;
        if (Math.abs(r - curveRow) <= 0.45 + ledOpen * 0.45) {
          const x = (c - (cols - 1) / 2) * gap;
          const y = mouthY + (r - 1) * gap;
          g.roundRect(x - dot / 2, y - dot / 2, dot, dot, dot * 0.25);
          g.fill({ color: ink });
        }
      }
    }
    return;
  }

  if (shape === "Cat") {
    const open = talkAmt * 70 * scale;
    if (open > 12 * scale) {
      g.ellipse(0, mouthY + 6 * scale, 44 * scale, 14 * scale + open * 0.6);
      g.fill({ color: ink });
    } else {
      const dip = 26 * scale;
      const w = 56 * scale;
      g.moveTo(-w, mouthY - 6 * scale);
      g.quadraticCurveTo(-w * 0.5, mouthY + dip, 0, mouthY - 2 * scale);
      g.quadraticCurveTo(w * 0.5, mouthY + dip, w, mouthY - 6 * scale);
      g.stroke({ width: Math.max(4, 14 * scale), color: ink, cap: "round" });
    }
    return;
  }

  if (shape === "Capsule") {
    const halfW = 84 * scale;
    const open = talkAmt * 65 * scale;
    if (open > 10 * scale) {
      const rw = halfW * 1.4;
      const rh = Math.max(14 * scale, open * 0.9);
      g.roundRect(-rw / 2, mouthY - rh / 2, rw, rh, rh / 2);
      g.stroke({ width: Math.max(4, 14 * scale), color: ink });
    } else {
      g.moveTo(-halfW, mouthY);
      g.quadraticCurveTo(0, mouthY + 12 * scale, halfW, mouthY);
      g.stroke({ width: Math.max(4, 14 * scale), color: ink, cap: "round" });
    }
    return;
  }

  if (shape === "Arc") {
    const halfW = 86 * scale;
    const open = talkAmt * 70 * scale;
    g.moveTo(-halfW, mouthY);
    g.quadraticCurveTo(0, mouthY + 20 * scale, halfW, mouthY);
    g.stroke({ width: Math.max(4, 16 * scale), color: ink, cap: "round" });
    if (open > 10 * scale) {
      g.moveTo(-halfW * 0.82, mouthY + 8 * scale);
      g.quadraticCurveTo(0, mouthY + 18 * scale + open, halfW * 0.82, mouthY + 8 * scale);
      g.stroke({ width: Math.max(4, 14 * scale), color: ink, cap: "round" });
    }
    return;
  }

  if (shape === "Ellipse") {
    const rx = (52 + talkAmt * 22) * scale;
    const ry = (8 + talkAmt * 44) * scale;
    g.ellipse(0, mouthY + 6 * scale, rx, ry);
    g.fill({ color: ink });
    return;
  }

  if (shape === "ZigZag") {
    const halfW = 92 * scale;
    const segs = 6;
    const amp = (8 + talkAmt * 36) * scale;
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const x = -halfW + t * halfW * 2;
      const y = mouthY + (i === 0 || i === segs ? 0 : i % 2 === 1 ? -amp : amp);
      if (i === 0) {
        g.moveTo(x, y);
      } else {
        g.lineTo(x, y);
      }
    }
    g.stroke({ width: Math.max(4, 14 * scale), color: ink, cap: "round", join: "round" });
    return;
  }

  if (shape === "Beak") {
    const halfW = 54 * scale;
    const topH = 26 * scale;
    const open = talkAmt * 42 * scale;
    g.moveTo(-halfW, mouthY);
    g.lineTo(0, mouthY - topH);
    g.lineTo(halfW, mouthY);
    g.lineTo(0, mouthY + 18 * scale + open);
    g.closePath();
    g.fill({ color: ink });
    return;
  }

  // SoftCurve (default): friendly neutral curved mouth opening on speech
  const halfW = 82 * scale;
  const open = talkAmt * 75 * scale;
  g.moveTo(-halfW, mouthY);
  g.quadraticCurveTo(0, mouthY + 24 * scale - open * 0.15, halfW, mouthY);
  if (open > 10 * scale) {
    g.quadraticCurveTo(0, mouthY + 24 * scale + open * 1.2, -halfW, mouthY);
    g.fill({ color: ink });
  } else {
    g.stroke({ width: Math.max(5, 16 * scale), color: ink, cap: "round" });
  }
}
