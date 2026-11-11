import type { PeerbotsColor } from "@peerbots/core";

export const color_mapping: Record<PeerbotsColor, string> = {
  "Light Blue": "#ABE3FA",
  Blue: "#5F94D6",
  Green: "#65C77D",
  Red: "#E6817E",
  Purple: "#9B86F3",
  Pink: "#EBA4E4",
  Yellow: "#F8EDB1",
  Orange: "#E6A575",
  Grey: "#CECECE",
  Black: "#4D4D4D",
  White: "#FDFEFE",
};

export const font_color_mapping: Record<PeerbotsColor, string> = {
  "Light Blue": "#020307",
  Blue: "#020307",
  Green: "#020307",
  Red: "#020307",
  Purple: "#020307",
  Pink: "#020307",
  Yellow: "#020307",
  Orange: "#020307",
  Grey: "#020307",
  Black: "#FDFEFE",
  White: "#020307",
};

export function hexToRgb(
  hex: string,
): { r: number; g: number; b: number } | null {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const expanded = hex.replace(shorthandRegex, (_m, r: string, g: string, b: string) => {
    return r + r + g + g + b + b;
  });

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(expanded);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export const hexToRgba = (color: string, alpha: number = 1): string | null => {
  const rgb = hexToRgb(color);
  if (rgb !== null) {
    return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
  }
  return null;
};

export function rgbaToHex(orig: string): string {
  const rgb = orig
    .replace(/\s/g, "")
    .match(/^rgba?\((\d+),(\d+),(\d+),?([^,\s)]+)?/i);
  if (!rgb) {
    return orig;
  }
  const alphaStr = (rgb[4] || "").trim();
  const hexRgb =
    (Number(rgb[1]) | (1 << 8)).toString(16).slice(1) +
    (Number(rgb[2]) | (1 << 8)).toString(16).slice(1) +
    (Number(rgb[3]) | (1 << 8)).toString(16).slice(1);

  const numericAlpha = alphaStr !== "" ? Number(alphaStr) : 1;
  const clampedAlpha = Math.max(0, Math.min(1, Number.isNaN(numericAlpha) ? 1 : numericAlpha));
  const hexAlpha = (Math.round(clampedAlpha * 255) | (1 << 8)).toString(16).slice(1);

  return hexRgb + hexAlpha;
}

export const rgbToRgba = (color: string, alpha: number = 1): string => {
  const [r = "0", g = "0", b = "0"] = color.replace(/[^\d,]/g, "").split(",");
  return `rgba(${r},${g},${b},${alpha})`;
};

/** Legacy alias preserved for compatibility with app.peerbots.org */
export const rbgToRgba = rgbToRgba;

export const deconstructRgba = (rgba: string): number[] => {
  return rgba
    .replace(/[^\d.,]/g, "")
    .split(",")
    .map((x) => Number(x));
};

export const formatRgba = (color: {
  r: number;
  g: number;
  b: number;
  a: number;
}): string => {
  return `rgba(${color.r},${color.g},${color.b},${color.a})`;
};

/** Legacy alias preserved for compatibility with app.peerbots.org */
export const formatRbga = formatRgba;

export const interpolateColor = (
  colorA: string,
  colorB: string,
  progress: number,
): string | null => {
  const rgbaColorA = hexToRgba(colorA);
  const rgbaColorB = hexToRgba(colorB);
  if (rgbaColorA && rgbaColorB) {
    const [r1, g1, b1, a1] = deconstructRgba(rgbaColorA);
    const [r2, g2, b2, a2] = deconstructRgba(rgbaColorB);
    const clampedProgress = Math.max(0, Math.min(1, progress));
    return formatRgba({
      r: Math.round(r1 + (r2 - r1) * clampedProgress),
      g: Math.round(g1 + (g2 - g1) * clampedProgress),
      b: Math.round(b1 + (b2 - b1) * clampedProgress),
      a: Number((a1 + (a2 - a1) * clampedProgress).toFixed(3)),
    });
  }
  return null;
};
