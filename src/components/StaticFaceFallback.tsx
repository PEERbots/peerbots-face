import { cn } from "@peerbots/core";
import { useFaceStore } from "../store/FaceStoreContext";
import {
  color_mapping,
  font_color_mapping,
} from "../helpers/color_mappers";
import {
  EMOTION_EMOJIS,
  EMOTION_EMOTICONS,
  getEmotionEyeSpritePaths,
  getEmotionIconPath,
} from "../helpers/emotion_mapper";

export interface StaticFaceFallbackProps {
  showSprites?: boolean;
  className?: string;
}

/**
 * Accessible static Peerbots Face representation used when running in headless test
 * environments (Playwright / Vitest / jsdom / pa11y) or when WebGL is unavailable.
 * Uses canonical Peerbots colors and optional canonical FaceAssets sprites.
 */
export function StaticFaceFallback({
  showSprites = true,
  className,
}: StaticFaceFallbackProps) {
  const selectedFace = useFaceStore((state) => state.selectedFace);
  const lastMessage = useFaceStore((state) => state.lastMessage);
  const isSpeaking = useFaceStore((state) => state.isSpeaking);
  const assetBaseUrl = useFaceStore((state) => state.assetBaseUrl);
  const faceSettings = useFaceStore((state) => state.faceSettings);

  const bgColor =
    color_mapping[lastMessage.color] ?? color_mapping["Light Blue"];
  const fgColor =
    font_color_mapping[lastMessage.color] ?? font_color_mapping["Light Blue"];

  const accessibleLabel = `${selectedFace.name} robot face, emotion ${lastMessage.emotion}, color ${lastMessage.color}${
    isSpeaking ? ", speaking" : ""
  }`;

  const pixiSettings = faceSettings.pixiSettings;
  const isTextDisplay =
    selectedFace.kind === "PixiFace" && selectedFace.type === "text";
  const isHugoStyleAvatar =
    selectedFace.kind === "PixiFace" &&
    selectedFace.type === "avatar" &&
    (selectedFace.name === "Hugo" || selectedFace.name === "Simple");

  const eyePaths = getEmotionEyeSpritePaths(
    lastMessage.emotion,
    "Hugo",
    assetBaseUrl,
  );
  const emotionIconPath = getEmotionIconPath(lastMessage.emotion, assetBaseUrl);

  const textEmotionMode =
    pixiSettings?.emotionDisplay ??
    (isTextDisplay ? selectedFace.showEmotion : "emoticon");

  return (
    <div
      role="img"
      aria-label={accessibleLabel}
      data-testid="static-face-fallback"
      data-face-name={selectedFace.name}
      data-face-kind={selectedFace.kind}
      data-emotion={lastMessage.emotion}
      data-color={lastMessage.color}
      data-speaking={String(isSpeaking)}
      className={cn(
        "flex flex-col items-center justify-center w-full h-full p-6 select-none transition-colors duration-200",
        className,
      )}
      style={{
        backgroundColor: bgColor,
        color: fgColor,
      }}
    >
      {isTextDisplay ? (
        <div className="flex flex-col items-center gap-3 font-mono text-center max-w-xl">
          {textEmotionMode !== "none" && (
            <span className="text-4xl font-bold" aria-hidden="true">
              {textEmotionMode === "emoji"
                ? EMOTION_EMOJIS[lastMessage.emotion]
                : EMOTION_EMOTICONS[lastMessage.emotion]}
            </span>
          )}
          {lastMessage.speech && (
            <span className="text-2xl font-semibold break-words">
              {lastMessage.speech}
            </span>
          )}
        </div>
      ) : showSprites && isHugoStyleAvatar ? (
        <div
          className="flex flex-col items-center justify-center gap-8"
          aria-hidden="true"
        >
          {pixiSettings?.eyeDisplay !== "none" && (
            <div className="flex items-center justify-center gap-16 md:gap-24">
              <div className="flex flex-col items-center">
                <img
                  src={eyePaths.left}
                  alt=""
                  className="w-20 h-20 md:w-28 md:h-28 object-contain"
                />
                {selectedFace.cheeks &&
                  pixiSettings?.cheekDisplay !== "none" && (
                    <img
                      src={selectedFace.cheeks.path}
                      alt=""
                      className="w-8 h-4 object-contain mt-1"
                    />
                  )}
              </div>
              <div className="flex flex-col items-center">
                <img
                  src={eyePaths.right}
                  alt=""
                  className="w-20 h-20 md:w-28 md:h-28 object-contain"
                />
                {selectedFace.cheeks &&
                  pixiSettings?.cheekDisplay !== "none" && (
                    <img
                      src={selectedFace.cheeks.path}
                      alt=""
                      className="w-8 h-4 object-contain mt-1"
                    />
                  )}
              </div>
            </div>
          )}
          {pixiSettings?.mouthDisplay !== "none" && (
            <div
              className={cn(
                "rounded-b-full bg-black transition-all duration-150",
                isSpeaking ? "w-16 h-8" : "w-14 h-3",
              )}
            />
          )}
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center gap-3"
          aria-hidden="true"
        >
          {showSprites && (
            <img
              src={emotionIconPath}
              alt=""
              className="w-20 h-20 object-contain"
            />
          )}
          <span className="text-sm font-semibold tracking-wide">
            {selectedFace.name} • {lastMessage.emotion}
          </span>
        </div>
      )}
    </div>
  );
}
