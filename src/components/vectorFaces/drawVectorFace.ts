import type { Graphics } from "pixi.js";
import type { FacePose } from "../../helpers/face_poses";
import type {
  PixiColorRole,
  VectorFaceStyleId,
} from "../../types/face";

export const DARK_VISOR_HEX = "#0F172A";
export const PULSE_VISOR_HEX = "#18181B";

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
  pose: FacePose;
  scale: number;
  talking: boolean;
  talkingScale: number;
  talkingTime: number;
  bgColor: string;
  themeColor: string;
  colorRole: PixiColorRole;
}

/**
 * Resolves the background color for a Pixi avatar given its `colorRole`
 * (`"background"` uses the single Peerbots color; `"accent"` uses a sleek dark visor).
 */
export function resolveAvatarBackgroundHex(
  themeHex: string,
  style: VectorFaceStyleId | null,
  colorRole: PixiColorRole = "background",
): string {
  if (colorRole === "accent") {
    return style === "pulse" ? PULSE_VISOR_HEX : DARK_VISOR_HEX;
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
    // Avoid invisible black eyes on a dark visor
    if (normalized === "#000000" || normalized === "#111111" || normalized === "#0f172a") {
      if (style === "pulse") return "#34D399";
      if (style === "pixel") return "#FBBF24";
      return "#38BDF8";
    }
    return themeHex;
  }
  if (normalized === "#000000") {
    return "#F8FAFC";
  }
  if (style === "pebble") return "#1B4332";
  if (style === "slate") return "#1E293B";
  return "#111827";
}

function drawEyelidOverlay(
  g: Graphics,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  bgColor: string,
  topLid: number,
  bottomLid: number,
  lidTilt: number,
  isLeft: boolean,
): void {
  const sign = isLeft ? 1 : -1;
  const tilt = lidTilt * 0.42 * sign;

  if (topLid > 0.01) {
    const padX = rx * 1.45;
    const topY = cy - ry * 1.5;
    const cutY = cy - ry + ry * 2 * topLid;
    const dy = Math.tan(tilt) * padX;
    g.moveTo(cx - padX, topY);
    g.lineTo(cx + padX, topY);
    g.lineTo(cx + padX, cutY + dy);
    g.lineTo(cx - padX, cutY - dy);
    g.closePath();
    g.fill({ color: bgColor });
  }

  if (bottomLid > 0.01) {
    const lift = ry * 1.45 * bottomLid;
    g.ellipse(cx, cy + ry * 1.4 - lift, rx * 1.32, ry * 0.92);
    g.fill({ color: bgColor });
  }
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

  const p0 = rotatePt(-halfWidth, straight ? 0 : halfWidth * 0.22 * arch);
  const ctrl = rotatePt(0, straight ? 0 : -halfWidth * 0.45 * arch);
  const p1 = rotatePt(halfWidth, straight ? 0 : halfWidth * 0.22 * arch);

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
 * Renders both eyes, eyelids, highlights, eyebrows, and cheeks for any of the 8 vector face styles.
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
    bgColor,
    themeColor,
    colorRole,
    showEyebrows,
    showCheeks,
  } = params;

  g.clear();

  const ink = resolveVectorInkHex(themeColor, style, colorRole);
  const eyeSep = 270 * scale;
  const gx = gazeX * 42 * scale;
  const gy = gazeY * 30 * scale;
  const sides: readonly (-1 | 1)[] = [-1, 1];

  for (const side of sides) {
    const isLeft = side < 0;
    const breathe = isLeft ? breatheLeft : breatheRight;
    const cx = side * eyeSep + gx;
    const cy = gy;

    if (style === "hugo") {
      // Hugo: slight classic left-eye asymmetry, twin specular highlights, soft cheeks, curved brows
      const asym = isLeft ? 1.06 : 1.0;
      const rx = 104 * pose.eyeWidth * breathe * asym * scale;
      const ry = Math.max(8 * scale, 114 * pose.eyeHeight * breathe * asym * blink * scale);

      if (showCheeks && pose.cheekAlpha > 0.02) {
        g.ellipse(cx + side * 26 * scale, cy + 145 * scale, 62 * scale, 30 * scale);
        g.fill({ color: "#F472B6", alpha: pose.cheekAlpha * 0.55 });
      }

      g.ellipse(cx, cy, rx, ry);
      g.fill({ color: ink });

      if (blink > 0.25) {
        g.ellipse(
          cx + rx * 0.28 + gx * 0.18,
          cy - ry * 0.26 + gy * 0.16,
          rx * 0.3 * pose.pupilScale,
          ry * 0.3 * pose.pupilScale,
        );
        g.fill({ color: "#FFFFFF" });
        g.ellipse(
          cx - rx * 0.26 + gx * 0.14,
          cy + ry * 0.28 + gy * 0.14,
          rx * 0.14,
          ry * 0.14,
        );
        g.fill({ color: "#FFFFFF" });
      }

      drawEyelidOverlay(
        g,
        cx,
        cy,
        rx,
        ry,
        bgColor,
        pose.topLid,
        pose.bottomLid,
        pose.lidTilt,
        isLeft,
      );

      if (showEyebrows) {
        drawCurvedBrow(
          g,
          cx,
          cy - 165 * scale + pose.browY * 68 * scale,
          68 * scale,
          pose.browArch,
          pose.browTilt,
          isLeft,
          Math.max(4, 15 * scale),
          ink,
        );
      }
    } else if (style === "mochi") {
      if (showCheeks && pose.cheekAlpha > 0.02) {
        g.ellipse(cx + side * 38 * scale, cy + 102 * scale, 56 * scale, 26 * scale);
        g.fill({ color: "#FB7185", alpha: pose.cheekAlpha * 0.6 });
      }

      if (pose.bottomLid > 0.32 && blink > 0.3) {
        // Happy ^ ^ kawaii arc
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
        g.ellipse(cx, cy, rx, ry);
        g.fill({ color: ink });

        if (blink > 0.3) {
          g.circle(cx + rx * 0.3, cy - ry * 0.28, 16 * scale);
          g.fill({ color: "#FFFFFF" });
        }

        drawEyelidOverlay(
          g,
          cx,
          cy,
          rx,
          ry,
          bgColor,
          pose.topLid,
          0,
          pose.lidTilt,
          isLeft,
        );
      }
    } else if (style === "pebble") {
      const w = 165 * pose.eyeWidth * breathe * scale;
      const h = Math.max(16 * scale, 194 * pose.eyeHeight * breathe * blink * scale);
      g.roundRect(cx - w / 2, cy - h / 2, w, h, Math.min(w, h) * 0.42);
      g.fill({ color: ink });

      if (blink > 0.25) {
        g.circle(cx + w * 0.14 + gx * 0.15, cy - h * 0.16 + gy * 0.12, 22 * scale);
        g.fill({ color: "#FFFFFF" });
      }

      drawEyelidOverlay(
        g,
        cx,
        cy,
        w / 2,
        h / 2,
        bgColor,
        pose.topLid,
        pose.bottomLid,
        pose.lidTilt,
        isLeft,
      );

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
      const w = 180 * pose.eyeWidth * breathe * scale;
      const h = Math.max(16 * scale, 172 * pose.eyeHeight * breathe * blink * scale);
      const radius = Math.min(w, h) * 0.35;

      // Soft neon glow halo
      g.roundRect(
        cx - w / 2 - 14 * scale,
        cy - h / 2 - 14 * scale,
        w + 28 * scale,
        h + 28 * scale,
        radius + 14 * scale,
      );
      g.fill({ color: ink, alpha: 0.2 });

      g.roundRect(cx - w / 2, cy - h / 2, w, h, radius);
      g.fill({ color: ink });

      drawEyelidOverlay(
        g,
        cx,
        cy,
        w / 2 + 16 * scale,
        h / 2 + 16 * scale,
        bgColor,
        pose.topLid,
        pose.bottomLid,
        pose.lidTilt,
        isLeft,
      );
    } else if (style === "orbit") {
      const eyeCenterX = side * eyeSep + gx * 0.45;
      const eyeCenterY = gy * 0.45;
      const rx = 112 * breathe * scale;
      const ry = Math.max(10 * scale, 112 * pose.eyeHeight * breathe * blink * scale);

      // Sclera
      g.ellipse(eyeCenterX, eyeCenterY, rx, ry);
      g.fill({ color: "#FFFFFF" });
      g.stroke({ width: Math.max(3, 12 * scale), color: ink });

      // Iris + Pupil with parallax gaze
      if (blink > 0.2) {
        const irisRx = rx * 0.56 * pose.pupilScale;
        const irisRy = Math.min(ry * 0.85, irisRx);
        g.ellipse(eyeCenterX + gx * 0.75, eyeCenterY + gy * 0.65, irisRx, irisRy);
        g.fill({ color: "#0284C7" });

        const pupilRx = rx * 0.3 * pose.pupilScale;
        const pupilRy = Math.min(ry * 0.65, pupilRx);
        g.ellipse(eyeCenterX + gx * 0.85, eyeCenterY + gy * 0.72, pupilRx, pupilRy);
        g.fill({ color: ink });
      }

      drawEyelidOverlay(
        g,
        eyeCenterX,
        eyeCenterY,
        rx + 14 * scale,
        ry + 14 * scale,
        bgColor,
        pose.topLid,
        pose.bottomLid,
        pose.lidTilt,
        isLeft,
      );

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
    } else if (style === "pulse") {
      const w = 185 * pose.eyeWidth * scale;
      const h = Math.max(14 * scale, (58 + (pose.eyeHeight - 0.7) * 120) * blink * scale);
      const px = side * eyeSep + gx * 0.7;
      const py = gy * 0.7;

      if (pose.bottomLid > 0.3 && blink > 0.25) {
        g.moveTo(px - w / 2, py + 18 * scale);
        g.quadraticCurveTo(px, py - 52 * scale, px + w / 2, py + 18 * scale);
        g.stroke({ width: Math.max(6, 26 * scale), color: ink, cap: "round" });
      } else {
        // Subtle glow + horizontal optical bar
        g.roundRect(
          px - w / 2 - 12 * scale,
          py - h / 2 - 12 * scale,
          w + 24 * scale,
          h + 24 * scale,
          (h + 24 * scale) / 2,
        );
        g.fill({ color: ink, alpha: 0.18 });
        g.roundRect(px - w / 2, py - h / 2, w, h, h / 2);
        g.fill({ color: ink });
      }
    } else if (style === "pixel") {
      // 5x5 retro LED matrix
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

      g.ellipse(px, py, rx, ry);
      g.fill({ color: ink });

      drawEyelidOverlay(
        g,
        px,
        py,
        rx + 10 * scale,
        ry + 10 * scale,
        bgColor,
        pose.topLid,
        pose.bottomLid,
        pose.lidTilt,
        isLeft,
      );

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
 * Renders an emotion-reactive + speech-amplitude-blended vector mouth for any of the 8 styles.
 */
export function drawVectorMouth(params: VectorMouthDrawParams): void {
  const {
    graphics: g,
    style,
    pose,
    scale,
    talking,
    talkingScale,
    talkingTime,
    themeColor,
    colorRole,
  } = params;

  g.clear();

  const ink = resolveVectorInkHex(themeColor, style, colorRole);
  const mouthY = 235 * scale;
  const talkAmt = talking ? talkingScale : 0;
  const open = Math.max(pose.mouthOpen * 70 * scale, talkAmt * 85 * scale);
  const curve = pose.mouthCurve * 65 * scale;
  const halfW = 100 * pose.mouthWidth * scale;

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
      g.moveTo(-halfW, mouthY);
      g.quadraticCurveTo(0, mouthY + curve, halfW, mouthY);
      g.stroke({ width: Math.max(5, 20 * scale), color: ink, cap: "round" });
    }
    return;
  }

  if (style === "pulse") {
    const segs = 24;
    const totalW = 360 * pose.mouthWidth * scale;
    for (let i = 0; i <= segs; i++) {
      const u = i / segs;
      const x = (u - 0.5) * totalW;
      const env = Math.sin(u * Math.PI);
      const wave =
        talkAmt > 0.04
          ? Math.sin(talkingTime * 0.02 + u * 10) * talkAmt * 65 * env * scale
          : 0;
      const smile = pose.mouthCurve * 38 * env * scale;
      const y = mouthY + smile + wave;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke({ width: Math.max(4, 12 * scale), color: ink, cap: "round" });
    return;
  }

  if (style === "pixel") {
    const cols = 9;
    const rows = 3;
    const dot = 22 * scale;
    const gap = 32 * scale;
    const ledOpen = Math.max(pose.mouthOpen * 2.1, talkAmt * 2.4);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const u = (c - 4) / 4;
        const curveRow = 1 + pose.mouthCurve * 0.9 * (1 - u * u) - pose.mouthCurve * 0.4;
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
    if (open > 14 * scale) {
      g.ellipse(0, mouthY + 8 * scale, 48 * pose.mouthWidth * scale, 16 * scale + open * 0.6);
      g.fill({ color: ink });
    } else if (pose.mouthCurve >= 0) {
      const dip = (20 + pose.mouthCurve * 30) * scale;
      const w = 62 * scale;
      g.moveTo(-w, mouthY - 8 * scale);
      g.quadraticCurveTo(-w * 0.5, mouthY + dip, 0, mouthY - 4 * scale);
      g.quadraticCurveTo(w * 0.5, mouthY + dip, w, mouthY - 8 * scale);
      g.stroke({ width: Math.max(4, 15 * scale), color: ink, cap: "round" });
    } else {
      g.moveTo(-55 * scale, mouthY + 14 * scale);
      g.quadraticCurveTo(0, mouthY + pose.mouthCurve * 55 * scale, 55 * scale, mouthY + 14 * scale);
      g.stroke({ width: Math.max(4, 15 * scale), color: ink, cap: "round" });
    }
    return;
  }

  if (style === "slate") {
    if (open > 12 * scale) {
      const rw = halfW * 1.45;
      const rh = Math.max(16 * scale, open * 0.9);
      g.roundRect(-rw / 2, mouthY - rh / 2, rw, rh, rh / 2);
      g.stroke({ width: Math.max(4, 14 * scale), color: ink });
    } else {
      g.moveTo(-halfW, mouthY);
      g.quadraticCurveTo(0, mouthY + curve * 0.7, halfW, mouthY);
      g.stroke({ width: Math.max(4, 14 * scale), color: ink, cap: "round" });
    }
    return;
  }

  if (style === "orbit") {
    g.moveTo(-halfW, mouthY);
    g.quadraticCurveTo(0, mouthY + curve, halfW, mouthY);
    g.stroke({ width: Math.max(4, 16 * scale), color: ink, cap: "round" });
    if (open > 10 * scale) {
      g.moveTo(-halfW * 0.82, mouthY + 8 * scale);
      g.quadraticCurveTo(0, mouthY + curve * 0.8 + open, halfW * 0.82, mouthY + 8 * scale);
      g.stroke({ width: Math.max(4, 14 * scale), color: ink, cap: "round" });
    }
    return;
  }

  // Hugo & Pebble: warm filled bean smile / curved mouth
  g.moveTo(-halfW, mouthY);
  g.quadraticCurveTo(0, mouthY + curve - open * 0.18, halfW, mouthY);
  if (open > 10 * scale) {
    g.quadraticCurveTo(0, mouthY + curve + open * 1.25, -halfW, mouthY);
    g.fill({ color: ink });
  } else {
    g.stroke({ width: Math.max(5, 18 * scale), color: ink, cap: "round" });
  }
}
