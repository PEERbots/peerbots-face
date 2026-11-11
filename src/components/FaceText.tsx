import { useEffect, useMemo } from "react";
import { Text, TextStyle } from "pixi.js";
import { useExtend, useTick } from "@pixi/react";
import { useFaceStore } from "../store/FaceStoreContext";
import { EMOTION_EMOJIS, EMOTION_EMOTICONS } from "../helpers/emotion_mapper";
import { useMessageVisualState } from "../hooks/useMessageVisualState";

const FONT_FAMILY = "Courier New, Courier, monospace";
const TEXT_PERSISTENCE_DURATION = 3000;
const MS_PER_CHAR = 50;
const PAUSE_BEFORE_NEXT_MSG = 500;

export function FaceText({ scale }: { scale: number }) {
  useExtend({ Text });

  const lastMessage = useFaceStore((state) => state.lastMessage);
  const isSpeaking = useFaceStore((state) => state.isSpeaking);
  const selectedFace = useFaceStore((state) => state.selectedFace);
  const pixiSettings = useFaceStore((state) => state.faceSettings.pixiSettings);

  const emotionType: "emoticon" | "emoji" | "none" = useMemo(() => {
    if (pixiSettings?.emotionDisplay) {
      return pixiSettings.emotionDisplay;
    }
    if (selectedFace?.kind === "PixiFace" && selectedFace.type === "text") {
      return selectedFace.showEmotion;
    }
    return "emoticon";
  }, [pixiSettings?.emotionDisplay, selectedFace]);

  const { displayText, queueMessage, update } = useMessageVisualState(
    isSpeaking,
    {
      msPerChar: MS_PER_CHAR,
      persistenceDuration: TEXT_PERSISTENCE_DURATION,
      pauseBeforeNextMsg: PAUSE_BEFORE_NEXT_MSG,
    },
  );

  useEffect(() => {
    queueMessage(lastMessage.speech);
  }, [lastMessage.speech, queueMessage]);

  useTick((delta) => {
    update(delta.deltaMS);
  });

  const emotionStyle = useMemo(
    () =>
      new TextStyle({
        fontFamily: FONT_FAMILY,
        fontSize: Math.max(12, 48 * scale),
        fill: "black",
        align: "center",
      }),
    [scale],
  );

  const bodyStyle = useMemo(
    () =>
      new TextStyle({
        fontFamily: FONT_FAMILY,
        fontSize: Math.max(12, 48 * scale),
        fill: "black",
        align: "center",
        wordWrap: true,
        wordWrapWidth: Math.max(200, 800 * scale),
      }),
    [scale],
  );

  const emotionSymbol =
    emotionType === "emoji"
      ? EMOTION_EMOJIS[lastMessage.emotion]
      : EMOTION_EMOTICONS[lastMessage.emotion];

  return (
    <>
      {emotionType !== "none" && (
        <pixiText
          anchor={0.5}
          x={0}
          y={-50 * scale}
          text={emotionSymbol}
          style={emotionStyle}
        />
      )}
      <pixiText
        text={displayText}
        anchor={0.5}
        x={0}
        y={0}
        style={bodyStyle}
      />
    </>
  );
}

export default FaceText;
