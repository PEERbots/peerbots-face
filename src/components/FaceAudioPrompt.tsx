import { useCallback } from "react";
import { Button, Icon, cn } from "@peerbots/core";
import { useFaceStore } from "../store/FaceStoreContext";
import { resolveFaceUiLabels, type FaceUiLabels } from "../types/labels";

export interface FaceAudioPromptProps {
  className?: string;
  position?: "fixed" | "absolute" | "inline";
  labels?: Partial<FaceUiLabels>;
  onEnable?: () => void;
}

export function FaceAudioPrompt({
  className = "",
  position = "absolute",
  labels,
  onEnable,
}: FaceAudioPromptProps) {
  const uiLabels = resolveFaceUiLabels(labels);
  const speechAllowed = useFaceStore((state) => state.speechAllowed);
  const setSpeechAllowed = useFaceStore((state) => state.setSpeechAllowed);
  const refreshVoices = useFaceStore((state) => state.refreshVoices);

  const handleEnableAudio = useCallback(() => {
    try {
      if (
        typeof window !== "undefined" &&
        "speechSynthesis" in window &&
        typeof SpeechSynthesisUtterance !== "undefined"
      ) {
        const utterance = new SpeechSynthesisUtterance(" ");
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.warn("Could not prime speechSynthesis:", err);
    }

    setSpeechAllowed(true);
    void refreshVoices();
    onEnable?.();
  }, [setSpeechAllowed, refreshVoices, onEnable]);

  if (speechAllowed) {
    return null;
  }

  const positionClasses =
    position === "fixed"
      ? "fixed top-4 left-1/2 -translate-x-1/2 z-50"
      : position === "absolute"
        ? "absolute top-4 left-1/2 -translate-x-1/2 z-50"
        : "inline-flex";

  return (
    <div
      className={cn(positionClasses, className)}
      data-testid="face-audio-prompt"
    >
      <Button
        variant="solid"
        color="darkblue"
        size="sm"
        onClick={handleEnableAudio}
        className="shadow-lg px-4 py-2 flex items-center gap-2 rounded-full cursor-pointer"
        aria-label={uiLabels.tapToEnableSound}
      >
        <Icon name="play" size="sm" className="w-3.5 h-3.5" />
        <span className="font-semibold text-xs tracking-wide">
          {uiLabels.tapToEnableSound}
        </span>
      </Button>
    </div>
  );
}
