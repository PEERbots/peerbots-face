import { useEffect } from "react";
import { useFaceStore } from "../store/FaceStoreContext";
import { useMessageVisualState } from "../hooks/useMessageVisualState";

export function FaceCaption() {
  const lastMessage = useFaceStore((state) => state.lastMessage);
  const settings = useFaceStore((state) => state.faceSettings);
  const isSpeaking = useFaceStore((state) => state.isSpeaking);

  const { displayText, queueMessage, update } = useMessageVisualState(
    isSpeaking,
    {
      msPerChar: 0,
      persistenceDuration: 1000,
    },
  );

  useEffect(() => {
    queueMessage(lastMessage.speech);
  }, [lastMessage.speech, queueMessage]);

  useEffect(() => {
    if (typeof requestAnimationFrame === "undefined") {
      return;
    }
    let lastTime = performance.now();
    let frameId: number;

    const tick = (now: number) => {
      const delta = now - lastTime;
      lastTime = now;
      update(delta);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [update]);

  if (!settings.captions || !settings.captions.enabled) {
    return null;
  }

  if (!displayText || displayText.trim() === "") {
    return null;
  }

  const offsetX = settings.captions.offset?.x ?? 0;
  const offsetY = settings.captions.offset?.y ?? 0;
  const fontSize = settings.captions.fontSize ?? 32;
  const captionStyle = settings.captions.style ?? "pill";

  const visualStyle =
    captionStyle === "outline"
      ? {
          color: "#ffffff",
          textShadow:
            "2px 2px 2px #000000, -1px -1px 0 #000000, 1px -1px 0 #000000, -1px 1px 0 #000000, 1px 1px 0 #000000",
        }
      : {
          color: "#ffffff",
          backgroundColor: "rgba(15, 23, 42, 0.75)",
          padding: "0.25rem 0.75rem",
          borderRadius: "0.75rem",
        };

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="face-caption"
      data-caption-style={captionStyle}
      className="pbf:absolute pbf:text-center pbf:w-[80%] pbf:pointer-events-none pbf:z-50 pbf:font-sans"
      style={{
        top: `calc(${offsetY}% + 80%)`,
        left: `calc(50% + ${offsetX}px)`,
        transform: "translate(-50%, -50%)",
        fontSize: `${fontSize}px`,
        ...visualStyle,
      }}
    >
      {displayText}
    </div>
  );
}

export default FaceCaption;
