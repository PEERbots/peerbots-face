import { useCallback } from "react";
import { Button, Icon } from "@peerbots/core";
import { faceCn as cn } from "../helpers/cn";
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
  const unlockAudio = useFaceStore((state) => state.unlockAudio);

  const handleEnableAudio = useCallback(() => {
    void unlockAudio();
    onEnable?.();
  }, [unlockAudio, onEnable]);

  if (speechAllowed) {
    return null;
  }

  const positionClasses =
    position === "fixed"
      ? "pbf:fixed pbf:top-4 pbf:left-1/2 pbf:-translate-x-1/2 pbf:z-50"
      : position === "absolute"
        ? "pbf:absolute pbf:top-4 pbf:left-1/2 pbf:-translate-x-1/2 pbf:z-50"
        : "pbf:inline-flex";

  return (
    <div
      className={cn(positionClasses, className)}
      data-testid="face-audio-prompt"
    >
      <Button
        variant="primary"
        size="sm"
        onClick={handleEnableAudio}
        className="pbf:shadow-lg pbf:border pbf:border-white/20 pbf:backdrop-blur-sm pbf:px-4 pbf:py-2 pbf:flex pbf:items-center pbf:gap-2 pbf:rounded-full pbf:cursor-pointer pbf:hover:scale-105 pbf:transition-transform"
        aria-label={uiLabels.tapToEnableSound}
      >
        <Icon name="play" size="sm" className="pbf:w-3.5 pbf:h-3.5" />
        <span className="pbf:font-semibold pbf:text-xs pbf:tracking-wide">
          {uiLabels.tapToEnableSound}
        </span>
      </Button>
    </div>
  );
}
