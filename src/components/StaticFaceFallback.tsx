import { faceCn as cn } from "../helpers/cn";
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
      className={cn("pbf:flex pbf:flex-col pbf:items-center pbf:justify-center pbf:w-full pbf:h-full pbf:p-6 pbf:select-none pbf:transition-colors pbf:duration-200",
        className,
      )}
      style={{
        backgroundColor: bgColor,
        color: fgColor,
      }}
    >
      {isTextDisplay ? (
        <div className="pbf:flex pbf:flex-col pbf:items-center pbf:gap-3 pbf:font-mono pbf:text-center pbf:max-w-xl">
          {textEmotionMode !== "none" && (
            <span className="pbf:text-4xl pbf:font-bold" aria-hidden="true">
              {textEmotionMode === "emoji"
                ? EMOTION_EMOJIS[lastMessage.emotion]
                : EMOTION_EMOTICONS[lastMessage.emotion]}
            </span>
          )}
          {lastMessage.speech && (
            <span className="pbf:text-2xl pbf:font-semibold pbf:break-words">
              {lastMessage.speech}
            </span>
          )}
        </div>
      ) : showSprites && isHugoStyleAvatar ? (
        <div
          className="pbf:flex pbf:flex-col pbf:items-center pbf:justify-center pbf:gap-8"
          aria-hidden="true"
        >
          {pixiSettings?.eyeDisplay !== "none" && (
            <div className="pbf:flex pbf:items-center pbf:justify-center pbf:gap-16 pbf:md:gap-24">
              <div className="pbf:flex pbf:flex-col pbf:items-center">
                <img
                  src={eyePaths.left}
                  alt=""
                  className="pbf:w-20 pbf:h-20 pbf:md:w-28 pbf:md:h-28 pbf:object-contain"
                />
                {selectedFace.cheeks &&
                  pixiSettings?.cheekDisplay !== "none" && (
                    <img
                      src={selectedFace.cheeks.path}
                      alt=""
                      className="pbf:w-8 pbf:h-4 pbf:object-contain pbf:mt-1"
                    />
                  )}
              </div>
              <div className="pbf:flex pbf:flex-col pbf:items-center">
                <img
                  src={eyePaths.right}
                  alt=""
                  className="pbf:w-20 pbf:h-20 pbf:md:w-28 pbf:md:h-28 pbf:object-contain"
                />
                {selectedFace.cheeks &&
                  pixiSettings?.cheekDisplay !== "none" && (
                    <img
                      src={selectedFace.cheeks.path}
                      alt=""
                      className="pbf:w-8 pbf:h-4 pbf:object-contain pbf:mt-1"
                    />
                  )}
              </div>
            </div>
          )}
          {pixiSettings?.mouthDisplay !== "none" && (
            <div
              className={cn("pbf:rounded-b-full pbf:bg-black pbf:transition-all pbf:duration-150",
                isSpeaking ? "pbf:w-16 pbf:h-8" : "pbf:w-14 pbf:h-3",
              )}
            />
          )}
        </div>
      ) : (
        <div
          className="pbf:flex pbf:flex-col pbf:items-center pbf:justify-center pbf:gap-3"
          aria-hidden="true"
        >
          {showSprites && (
            <img
              src={emotionIconPath}
              alt=""
              className="pbf:w-20 pbf:h-20 pbf:object-contain"
            />
          )}
          <span className="pbf:text-sm pbf:font-semibold pbf:tracking-wide">
            {selectedFace.name} • {lastMessage.emotion}
          </span>
        </div>
      )}
    </div>
  );
}
