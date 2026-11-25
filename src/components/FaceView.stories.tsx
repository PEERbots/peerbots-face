import { useEffect, useMemo } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@peerbots/core";
import { createPeerbotsFaceStore } from "../store/createPeerbotsFaceStore";
import { FaceStoreProvider, useFaceStore } from "../store/FaceStoreContext";
import { builtInFaces } from "../types/face";
import { FaceAudioPrompt } from "./FaceAudioPrompt";
import { FaceTester } from "./FaceTester";
import { FaceView } from "./FaceView";

const meta: Meta<typeof FaceView> = {
  title: "Face/FaceView",
  component: FaceView,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof FaceView>;

export const HugoHappy: Story = {
  render: () => {
    const store = createPeerbotsFaceStore({
      isSilent: true,
      initialFace: builtInFaces[0],
      initialMessage: {
        title: "Hello",
        speech: "Hello friend!",
        color: "Light Blue",
        emotion: "Happy",
      },
    });
    return (
      <FaceStoreProvider store={store}>
        <div className="w-full h-[420px]">
          <FaceView />
        </div>
      </FaceStoreProvider>
    );
  },
};

export const RoboticSurprised: Story = {
  render: () => {
    const store = createPeerbotsFaceStore({
      isSilent: true,
      initialFace: builtInFaces[2],
      initialMessage: {
        title: "Whoa",
        speech: "System alert!",
        color: "Yellow",
        emotion: "Surprised",
      },
    });
    return (
      <FaceStoreProvider store={store}>
        <div className="w-full h-[420px]">
          <FaceView />
        </div>
      </FaceStoreProvider>
    );
  },
};

export const DisplayTextWithCaptions: Story = {
  render: () => {
    const store = createPeerbotsFaceStore({
      isSilent: true,
      initialFace: builtInFaces[3],
      initialSettings: {
        captions: {
          enabled: true,
          fontSize: 24,
          offset: { x: 0, y: 0 },
        },
      },
      initialMessage: {
        title: "Greeting",
        speech: "Ready to learn together!",
        color: "Green",
        emotion: "Happy",
      },
    });
    return (
      <FaceStoreProvider store={store}>
        <div className="w-full h-[420px]">
          <FaceView />
        </div>
      </FaceStoreProvider>
    );
  },
};

const QUICK_PHRASES = [
  "Hello! I am a Peerbot.",
  "Switching voice",
  "Let us learn together today!",
];

function SpeakPlaygroundControls() {
  const lastMessage = useFaceStore((state) => state.lastMessage);
  const speechAllowed = useFaceStore((state) => state.speechAllowed);
  const isSpeaking = useFaceStore((state) => state.isSpeaking);
  const unlockAudio = useFaceStore((state) => state.unlockAudio);
  const updateLastMessage = useFaceStore((state) => state.updateLastMessage);
  const stopSpeech = useFaceStore((state) => state.stopSpeech);
  const refreshVoices = useFaceStore((state) => state.refreshVoices);

  useEffect(() => {
    void refreshVoices();
  }, [refreshVoices]);

  const speakMessage = (
    next: Parameters<typeof updateLastMessage>[0],
    sender = "storybook",
  ) => {
    if (!speechAllowed && next.speech.trim().length > 0) {
      void unlockAudio().finally(() => {
        void updateLastMessage(next, sender);
      });
      return;
    }
    void updateLastMessage(next, sender);
  };

  return (
    <div className="pbf:p-4 pbf:bg-white pbf:border-t pbf:border-slate-200 pbf:max-w-3xl pbf:mx-auto pbf:w-full">
      <FaceTester onSendMessage={speakMessage} />
      <div className="pbf:flex pbf:flex-wrap pbf:items-center pbf:gap-2 pbf:mt-3">
        {QUICK_PHRASES.map((phrase) => (
          <Button
            key={phrase}
            variant="secondary"
            size="sm"
            onClick={() =>
              speakMessage({
                ...lastMessage,
                title: phrase,
                speech: phrase,
              })
            }
          >
            {phrase}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          disabled={!isSpeaking}
          onClick={stopSpeech}
        >
          Stop
        </Button>
      </div>
    </div>
  );
}

function SpeakPlaygroundStory() {
  const store = useMemo(
    () =>
      createPeerbotsFaceStore({
        isSilent: false,
        initialFace: builtInFaces[0],
        initialSettings: {
          showFullScreenButton: true,
          showScrollButton: true,
          captions: {
            enabled: true,
            fontSize: 28,
            style: "pill",
            offset: { x: 0, y: 0 },
          },
        },
        initialMessage: {
          title: "Ready",
          speech: "",
          color: "Light Blue",
          emotion: "Happy",
        },
      }),
    [],
  );

  return (
    <FaceStoreProvider store={store}>
      <div className="pbf:flex pbf:flex-col pbf:w-full">
        <div className="pbf:relative pbf:w-full pbf:h-[420px]">
          <FaceAudioPrompt />
          <FaceView />
        </div>
        <SpeakPlaygroundControls />
      </div>
    </FaceStoreProvider>
  );
}

export const SpeakPlayground: Story = {
  render: () => <SpeakPlaygroundStory />,
};
