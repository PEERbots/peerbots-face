import type { TimedViseme } from "../types/face";
import type { VizijStandardViseme } from "../types/profile";

export type PollyViseme =
  | "@"
  | "a"
  | "e"
  | "E"
  | "f"
  | "i"
  | "k"
  | "l"
  | "o"
  | "O"
  | "p"
  | "r"
  | "s"
  | "S"
  | "t"
  | "T"
  | "u"
  | "sil";

export const pollyVisemeToVizijPath: Record<PollyViseme, string> = {
  "@": "pose_pzzzfnvy",
  a: "a",
  e: "e_2",
  E: "e",
  f: "f",
  i: "i",
  k: "k",
  l: "r",
  o: "o",
  O: "o_2",
  p: "p",
  r: "r",
  s: "s",
  S: "s",
  t: "t",
  T: "t_2",
  u: "u",
  sil: "",
};

/**
 * Maps AWS Polly viseme marks to the 15-shape Oculus/Meta vocabulary used by
 * the Vizij 1.0 Face Standard (`standard/vizij/viseme/<shape>`).
 */
export const pollyVisemeToStandardViseme: Record<
  PollyViseme,
  VizijStandardViseme
> = {
  "@": "aa",
  a: "aa",
  e: "E",
  E: "E",
  f: "FF",
  i: "ih",
  k: "kk",
  l: "nn",
  o: "oh",
  O: "oh",
  p: "PP",
  r: "RR",
  s: "SS",
  S: "CH",
  t: "DD",
  T: "TH",
  u: "ou",
  sil: "sil",
};

export const possiblePollyVisemes: string[] = Array.from(
  new Set(Object.values(pollyVisemeToVizijPath).filter((v) => v.length > 0)),
);

export function mapVisemeToVizijTarget(viseme: string): string {
  if (Object.prototype.hasOwnProperty.call(pollyVisemeToVizijPath, viseme)) {
    return pollyVisemeToVizijPath[viseme as PollyViseme];
  }
  return "";
}

export function mapVisemeToStandardViseme(viseme: string): VizijStandardViseme {
  if (Object.prototype.hasOwnProperty.call(pollyVisemeToStandardViseme, viseme)) {
    return pollyVisemeToStandardViseme[viseme as PollyViseme];
  }
  return "sil";
}

const CHAR_TO_POLLY_VISEME: Record<string, PollyViseme> = {
  a: "a",
  b: "p",
  c: "k",
  d: "t",
  e: "e",
  f: "f",
  g: "k",
  h: "@",
  i: "i",
  j: "S",
  k: "k",
  l: "l",
  m: "p",
  n: "t",
  o: "o",
  p: "p",
  q: "k",
  r: "r",
  s: "s",
  t: "t",
  u: "u",
  v: "f",
  w: "u",
  x: "s",
  y: "i",
  z: "s",
};

/**
 * Estimates timed Polly-compatible viseme durations (in seconds, matching VizijPoseSetter)
 * for plain text when synthesized speech marks are not provided (e.g., native Web Speech API).
 */
export function estimateVisemesFromText(
  text: string,
  msPerChar: number = 65,
): TimedViseme[] {
  const cleaned = text.trim();
  if (!cleaned) {
    return [];
  }

  const visemes: TimedViseme[] = [];
  const durationSec = Math.max(0.03, msPerChar / 1000);

  for (const ch of cleaned.toLowerCase()) {
    const mapped: PollyViseme = CHAR_TO_POLLY_VISEME[ch] ?? "sil";
    const prev = visemes[visemes.length - 1];
    if (prev && prev.value === mapped) {
      prev.time = Number((prev.time + durationSec).toFixed(4));
    } else {
      visemes.push({
        time: Number(durationSec.toFixed(4)),
        type: "viseme",
        value: mapped,
      });
    }
  }

  if (visemes[visemes.length - 1]?.value !== "sil") {
    visemes.push({
      time: 0.1,
      type: "viseme",
      value: "sil",
    });
  }

  return visemes;
}
