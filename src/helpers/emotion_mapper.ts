import {
  normalizeAssetBaseUrl,
  type PeerbotsEmotion,
} from "../types/face";

export const EMOTION_EMOTICONS: Record<PeerbotsEmotion, string> = {
  Happy: ":D",
  Sad: ":(",
  Surprised: ":o",
  Neutral: ":)",
  Sleepy: ":z",
  Concerned: ":/",
};

export const EMOTION_EMOJIS: Record<PeerbotsEmotion, string> = {
  Happy: "😀",
  Sad: "😢",
  Surprised: "😮",
  Neutral: "😐",
  Sleepy: "😴",
  Concerned: "😟",
};

export const EMOTION_ICON_FILES: Record<PeerbotsEmotion, string> = {
  Neutral: "Neutral.png",
  Surprised: "Surprised.png",
  Happy: "Neutral.png",
  Sad: "Sad.png",
  Concerned: "Concerned.png",
  Sleepy: "Sleep.png",
};

export function getEmotionIconPath(
  emotion: PeerbotsEmotion,
  assetBaseUrl?: string,
): string {
  const base = normalizeAssetBaseUrl(assetBaseUrl);
  const file = EMOTION_ICON_FILES[emotion] ?? EMOTION_ICON_FILES.Neutral;
  return `${base}/Icons/${file}`;
}

export function getEmotionEyeSpritePaths(
  emotion: PeerbotsEmotion,
  character: "Hugo" = "Hugo",
  assetBaseUrl?: string,
): { left: string; right: string } {
  const base = normalizeAssetBaseUrl(assetBaseUrl);
  const key = emotion.toLowerCase();
  return {
    left: `${base}/${character}/${key}_l.png`,
    right: `${base}/${character}/${key}_r.png`,
  };
}

export const emotion_mapping: Record<PeerbotsEmotion, string> = {
  Neutral: getEmotionIconPath("Neutral"),
  Surprised: getEmotionIconPath("Surprised"),
  Happy: getEmotionIconPath("Happy"),
  Sad: getEmotionIconPath("Sad"),
  Concerned: getEmotionIconPath("Concerned"),
  Sleepy: getEmotionIconPath("Sleepy"),
};
