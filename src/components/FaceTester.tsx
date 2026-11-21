import { useRef } from "react";
import {
  Button,
  EmotionSelector,
  Input,
  PeerbotsColorSelector,
  type Emotion,
  type PeerbotsColor,
} from "@peerbots/core";
import { useFaceStore } from "../store/FaceStoreContext";
import { resolveFaceUiLabels, type FaceUiLabels } from "../types/labels";

export interface FaceTesterProps {
  labels?: Partial<FaceUiLabels>;
  onSendMessage?: (
    message: {
      title: string;
      speech: string;
      color: PeerbotsColor;
      emotion: Emotion;
    },
    sender: string,
  ) => void;
}

export function FaceTester({ labels, onSendMessage }: FaceTesterProps = {}) {
  const uiLabels = resolveFaceUiLabels(labels);
  const textToSpeak = useRef<HTMLInputElement>(null);

  const lastMessage = useFaceStore((state) => state.lastMessage);
  const updateLastMessage = useFaceStore((state) => state.updateLastMessage);

  const dispatchMessage = (next: {
    title: string;
    speech: string;
    color: PeerbotsColor;
    emotion: Emotion;
  }) => {
    if (onSendMessage) {
      onSendMessage(next, "system");
      return;
    }
    updateLastMessage(next, "system");
  };

  const triggerSpeak = () => {
    if (!textToSpeak.current) return;
    const text = textToSpeak.current.value;
    dispatchMessage({ ...lastMessage, speech: text });
    textToSpeak.current.value = "";
  };

  return (
    <div>
      <div className="pbf:flex pbf:my-2">
        <div>
          <div className="pbf:text-xs">{uiLabels.sendEmotion}</div>
          <EmotionSelector
            selectedEmotion=""
            onEmotionSelect={(emotion) => {
              dispatchMessage({ ...lastMessage, emotion, speech: "" });
            }}
          />
        </div>
        <div className="pbf:flex-1" />
        <div>
          <div className="pbf:text-xs">{uiLabels.sendColor}</div>
          <PeerbotsColorSelector
            selectedColor=""
            onColorSelect={(color) => {
              dispatchMessage({ ...lastMessage, color, speech: "" });
            }}
          />
        </div>
      </div>
      <div className="pbf:flex pbf:mt-2 pbf:pt-2 pbf:gap-2">
        <Input
          ref={textToSpeak}
          placeholder={uiLabels.textToSpeakPlaceholder}
          aria-label={uiLabels.textToSpeakAria}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              triggerSpeak();
            }
          }}
        />
        <Button onClick={triggerSpeak}>{uiLabels.speak}</Button>
      </div>
    </div>
  );
}

export default FaceTester;
