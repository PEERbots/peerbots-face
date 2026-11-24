import type { Graphics } from "pixi.js";
import type { FacePose } from "../../helpers/face_poses";
import type {
  PixiColorRole,
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
}

export interface VectorMouthDrawParams {
  graphics: Graphics;
  style: VectorFaceStyleId;
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
): { visibleTop: number; visibleBottom: number } {
  const segments = 48;
  const sign = isLeft ? 1 : -1;
  const tiltSlope = Math.tan(lidTilt * 0.48 * sign);
  const exp = 2 / superellipsePower;

  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);

    let lx = rx * Math.sign(cosT) * Math.pow(Math.abs(cosT), exp);
    let ly = ry * Math.sign(sinT) * Math.pow(Math.abs(sinT), exp);

    // Classic Hugo Surprised egg/teardrop taper (narrower toward bottom)
    if (bottomTaper > 0.005 && sinT > 0) {
      lx *= 1 - bottomTaper * sinT * 0.65;
    }

    // Upper eyelid line (flat for Concerned, angled for Sad)
    const topCutY =
      topLid > 0.005 ? -ry + ry * 1.95 * topLid + tiltSlope * lx : -ry * 1.1;

    // Lower eyelid upward crescent arch (classic Happy rainbow-bean eye)
    const normX = Math.max(-1, Math.min(1, lx / Math.max(1, rx)));
    const archFactor = Math.cos(normX * (Math.PI / 2));
    const botCutY =
      bottomLid > 0.005 ? ry - bottomLid * ry * 1.38 * archFactor : ry * 1.1;

    if (topCutY >= botCutY) {
      ly = (topCutY + botCutY) * 0.5;
    } else {
      ly = Math.max(topCutY, Math.min(botCutY, ly));
    }

    const px = cx + lx;
    const py = cy + ly;
    if (i === 0) {
      g.moveTo(px, py);
    } else {
      g.lineTo(px, py);
    }
  }
  g.closePath();

  const visibleTop = topLid > 0.005 ? -ry + ry * 1.95 * topLid : -ry;
  const visibleBottom = bottomLid > 0.005 ? ry - bottomLid * ry * 1.38 : ry;
  return { visibleTop, visibleBottom };
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
 * Renders both eyes, eyelids, highlights, eyebrows, and cheeks for any of the 7 vector face styles.
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
  } = params;

  g.clear();

  const ink = resolveVectorInkHex(themeColor, style, colorRole);
  const eyeSep = style === "hugo" ? 300 * scale : 270 * scale;
  const gx = gazeX * 40 * scale;
  const gy = gazeY * 30 * scale;
  const sides: readonly (-1 | 1)[] = [-1, 1];

  for (const side of sides) {
    const isLeft = side < 0;
    const breathe = isLeft ? breatheLeft : breatheRight;
    const cx = side * eyeSep + gx;
    const cy = gy;

    if (style === "hugo") {
      // Faithful to classic Hugo: 1.1 left-to-right eye scale ratio, pure black eyes,
      // delicate thin eyebrows at y=-180, soft oval cheeks at y=+150, twin white highlights.
      const asym = isLeft ? 1.1 : 1.0;
      const rx = 115 * pose.eyeWidth * breathe * asym * scale;
      const ry = Math.max(8 * scale, 115 * pose.eyeHeight * breathe * asym * blink * scale);

      if (showCheeks && pose.cheekAlpha > 0.02) {
        g.ellipse(cx, cy + 150 * scale, 44 * breathe * scale, 21 * breathe * scale);
        g.fill({ color: "#F48FB1", alpha: pose.cheekAlpha * 0.72 });
      }

      if (pose.sleepyArc > 0.65) {
        // Classic Hugo thin downward-curving crescent sleep eye
        const arcW = rx * 0.92;
        const arcY = cy + 28 * scale;
        const depth = 46 * scale * pose.sleepyArc;
        g.moveTo(cx - arcW, arcY - depth * 0.35);
        g.quadraticCurveTo(cx, arcY + depth, cx + arcW, arcY - depth * 0.35);
        g.quadraticCurveTo(
          cx,
          arcY + depth * 0.68,
          cx - arcW,
          arcY - depth * 0.35,
        );
        g.closePath();
        g.fill({ color: ink });
      } else {
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
          2,
          pose.bottomTaper,
        );
        g.fill({ color: ink });

        const apertureH = Math.max(0, visibleBottom - visibleTop);
        const apertureMidY = (visibleTop + visibleBottom) * 0.5;
        if (blink > 0.25 && apertureH > 26 * scale) {
          const hlScale = Math.min(1, apertureH / (ry * 1.45));
          const mainR = Math.min(rx * 0.3 * pose.pupilScale * hlScale, apertureH * 0.34);
          g.ellipse(
            cx + rx * 0.32 + gx * 0.12,
            cy + apertureMidY - apertureH * 0.14 + gy * 0.08,
            mainR,
            mainR * (1 + pose.bottomTaper * 0.35),
          );
          g.fill({ color: "#FFFFFF" });

          if (apertureH > 46 * scale) {
            const subR = Math.min(rx * 0.145 * hlScale, apertureH * 0.18);
            g.ellipse(
              cx - rx * 0.32 + gx * 0.08,
              cy + apertureMidY + apertureH * 0.22 + gy * 0.06,
              subR,
              subR * (1 + pose.bottomTaper * 0.35),
            );
            g.fill({ color: "#FFFFFF" });
          }
        }
      }

      if (showEyebrows) {
        // Classic Hugo thin delicate arched eyebrow at y = -180 * scale
        drawCurvedBrow(
          g,
          cx,
          cy - 180 * scale + pose.browY * 32 * scale,
          38 * breathe * scale,
          0.95 + pose.browArch * 0.5,
          pose.browTilt * 0.5,
          isLeft,
          Math.max(1.5, 3.5 * scale),
          ink,
        );
      }
    } else if (style === "mochi") {
      if (showCheeks && pose.cheekAlpha > 0.02) {
        g.ellipse(cx + side * 38 * scale, cy + 102 * scale, 56 * scale, 26 * scale);
        g.fill({ color: "#FB7185", alpha: pose.cheekAlpha * 0.6 });
      }

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

      if (showEyebrows) {
        drawCurvedBrow(
          g,
          cx,
          cy - 148 * scale + pose.browY * 60 * scale,
          58 * scale,
          pose.browArch,
          pose.browTilt,
          isLeft,
          Math.max(5, 20 * scale),
          ink,
        );
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

      if (showEyebrows) {
        drawCurvedBrow(
          g,
          eyeCenterX,
          eyeCenterY - 155 * scale + pose.browY * 60 * scale,
          72 * scale,
          pose.browArch * 0.4,
          pose.browTilt,
          isLeft,
          Math.max(5, 20 * scale),
          ink,
        );
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

      if (showEyebrows) {
        drawCurvedBrow(
          g,
          px,
          py - 120 * scale + pose.browY * 50 * scale,
          72 * scale,
          0,
          pose.browTilt * 0.8,
          isLeft,
          Math.max(4, 15 * scale),
          "#64748B",
          true,
        );
      }
    }
  }
}

/**
 * Renders a speech-only neutral mouth for each of the 7 vector face styles
 * (emotions are expressed solely by the eyes).
 */
export function drawVectorMouth(params: VectorMouthDrawParams): void {
  const {
    graphics: g,
    style,
    scale,
    talking,
    talkingScale,
    talkingTime,
    themeColor,
    colorRole,
  } = params;

  g.clear();

  const ink = resolveVectorInkHex(themeColor, style, colorRole);
  const mouthY = 240 * scale;
  const talkAmt = talking ? talkingScale : 0;

  if (style === "hugo") {
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

  if (style === "dash") {
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

  if (style === "pixel") {
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

  if (style === "mochi") {
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

  if (style === "slate") {
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

  if (style === "orbit") {
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

  // Pebble: friendly neutral curved mouth opening on speech
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
