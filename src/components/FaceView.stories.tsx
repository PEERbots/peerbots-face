import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { createPeerbotsFaceStore } from "../store/createPeerbotsFaceStore";
import { FaceStoreProvider } from "../store/FaceStoreContext";
import {
  PEERBOTS_COLORS,
  PEERBOTS_EMOTIONS,
  availableFaces,
  builtInFaces,
  type PeerbotsColor,
  type PeerbotsEmotion,
} from "../types/face";
import type { PeerbotsConversationState } from "../types/profile";
import { FaceView } from "./FaceView";

interface PlaygroundArgs {
  faceName: string;
  emotion: PeerbotsEmotion;
  color: PeerbotsColor;
  conversationState: PeerbotsConversationState;
  expressivity: number;
  zoom: number;
  rotation: number;
}

const FACE_NAMES = availableFaces
  .filter((f) => f.name !== "Custom Face")
  .map((f) => f.name);

function InteractiveFaceStory(args: PlaygroundArgs) {
  const [store] = useState(() =>
    createPeerbotsFaceStore({
      isSilent: true,
      initialFace:
        availableFaces.find((f) => f.name === args.faceName) ??
        builtInFaces[0],
      initialMessage: {
        title: args.emotion,
        speech: "",
        color: args.color,
        emotion: args.emotion,
      },
    }),
  );

  useEffect(() => {
    store.getState().setFaceByName(args.faceName);
  }, [store, args.faceName]);

  useEffect(() => {
    store.setState({
      lastMessage: {
        title: args.emotion,
        speech:
          args.conversationState === "speaking"
            ? "Hello! Testing smooth expressions."
            : "",
        color: args.color,
        emotion: args.emotion,
      },
    });
  }, [store, args.emotion, args.color, args.conversationState]);

  useEffect(() => {
    store.getState().setConversationState(args.conversationState);
    store.setState({
      isSpeaking: args.conversationState === "speaking",
      currentAmplitude: args.conversationState === "speaking" ? 0.65 : 0,
    });
  }, [store, args.conversationState]);

  useEffect(() => {
    store.getState().setFaceSettings({
      zoom: args.zoom,
      rotation: args.rotation,
      vizijSettings: { faceExpressivity: args.expressivity },
    });
  }, [store, args.zoom, args.rotation, args.expressivity]);

  return (
    <FaceStoreProvider store={store}>
      <div className="flex flex-col w-full h-[520px] bg-slate-950">
        <div
          className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-900 text-slate-100 text-xs border-b border-slate-800"
          role="toolbar"
          aria-label="Emotion and blink quick controls"
        >
          <div className="flex flex-wrap items-center gap-1">
            {PEERBOTS_EMOTIONS.map((emo) => (
              <button
                key={emo}
                type="button"
                onClick={() =>
                  store.setState({
                    lastMessage: {
                      ...store.getState().lastMessage,
                      title: emo,
                      emotion: emo,
                    },
                  })
                }
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-teal-600 text-white transition-colors cursor-pointer"
              >
                {emo}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => store.getState().triggerBlink()}
            className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white transition-colors cursor-pointer"
          >
            Blink
          </button>
        </div>
        <div className="flex-1 min-h-0">
          <FaceView />
        </div>
      </div>
    </FaceStoreProvider>
  );
}

function AllEmotionsGrid({
  faceName,
  color,
  expressivity,
}: Pick<PlaygroundArgs, "faceName" | "color" | "expressivity">) {
  const face =
    availableFaces.find((f) => f.name === faceName) ?? builtInFaces[0];

  return (
    <div className="grid grid-cols-3 gap-3 p-3 bg-slate-100">
      {PEERBOTS_EMOTIONS.map((emo) => {
        const store = createPeerbotsFaceStore({
          isSilent: true,
          initialFace: face,
          initialSettings: {
            showFullScreenButton: false,
            showScrollButton: false,
            vizijSettings: { faceExpressivity: expressivity },
          },
          initialMessage: {
            title: emo,
            speech: "",
            color,
            emotion: emo,
          },
        });
        return (
          <div
            key={`${face.name}-${emo}-${color}-${expressivity}`}
            className="flex flex-col rounded-lg overflow-hidden border border-slate-300 bg-white"
          >
            <div className="h-[220px] w-full">
              <FaceStoreProvider store={store}>
                <FaceView isPreview />
              </FaceStoreProvider>
            </div>
            <div className="px-2.5 py-1.5 text-xs font-semibold text-slate-800 border-t border-slate-200 flex items-center justify-between">
              <span>{emo}</span>
              <span className="text-slate-500 font-normal">{face.name}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const meta: Meta<PlaygroundArgs> = {
  title: "Face/FaceView",
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    faceName: {
      control: "select",
      options: FACE_NAMES,
      description: "Character preset to display",
    },
    emotion: {
      control: "select",
      options: [...PEERBOTS_EMOTIONS],
      description: "Target Peerbots emotion",
    },
    color: {
      control: "select",
      options: [...PEERBOTS_COLORS],
      description: "Single Peerbots theme color",
    },
    conversationState: {
      control: "inline-radio",
      options: ["idle", "listening", "thinking", "speaking"],
      description: "HRI conversation turn-taking state",
    },
    expressivity: {
      control: { type: "range", min: 0, max: 1, step: 0.05 },
      description: "Expression intensity (0 = neutral, 1 = full)",
    },
    zoom: {
      control: { type: "range", min: 0.5, max: 2, step: 0.05 },
      description: "Zoom factor",
    },
    rotation: {
      control: "inline-radio",
      options: [0, 90, 180, 270],
      description: "Rotation in degrees",
    },
  },
  args: {
    faceName: "Hugo",
    emotion: "Happy",
    color: "Light Blue",
    conversationState: "idle",
    expressivity: 1,
    zoom: 1,
    rotation: 0,
  },
};

export default meta;
type Story = StoryObj<PlaygroundArgs>;

export const InteractivePlayground: Story = {
  render: (args) => <InteractiveFaceStory {...args} />,
};

export const AllEmotionsForFace: Story = {
  render: (args) => (
    <AllEmotionsGrid
      faceName={args.faceName}
      color={args.color}
      expressivity={args.expressivity}
    />
  ),
};

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

export const MochiCuteHappy: Story = {
  render: () => {
    const mochi = builtInFaces.find((f) => f.name === "Mochi") ?? builtInFaces[0];
    const store = createPeerbotsFaceStore({
      isSilent: true,
      initialFace: mochi,
      initialMessage: {
        title: "Yay",
        speech: "Nice to meet you!",
        color: "Pink",
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

export const DashDarkVisorAccent: Story = {
  render: () => {
    const dash = builtInFaces.find((f) => f.name === "Dash") ?? builtInFaces[0];
    const store = createPeerbotsFaceStore({
      isSilent: true,
      initialFace: dash,
      initialMessage: {
        title: "Ready",
        speech: "Systems online.",
        color: "Light Blue",
        emotion: "Neutral",
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

export const PulseSleekAbstract: Story = {
  render: () => {
    const pulse = builtInFaces.find((f) => f.name === "Pulse") ?? builtInFaces[0];
    const store = createPeerbotsFaceStore({
      isSilent: true,
      initialFace: pulse,
      initialMessage: {
        title: "Listening",
        speech: "Go ahead, I am listening.",
        color: "Green",
        emotion: "Neutral",
      },
    });
    store.getState().setConversationState("listening");
    return (
      <FaceStoreProvider store={store}>
        <div className="w-full h-[420px]">
          <FaceView />
        </div>
      </FaceStoreProvider>
    );
  },
};

export const SlateCalmArchitectural: Story = {
  render: () => {
    const slate = builtInFaces.find((f) => f.name === "Slate") ?? builtInFaces[0];
    const store = createPeerbotsFaceStore({
      isSilent: true,
      initialFace: slate,
      initialMessage: {
        title: "Focus",
        speech: "Let us work through this step by step.",
        color: "Grey",
        emotion: "Neutral",
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

export const HugoVizijExpressive: Story = {
  render: () => {
    const hugoVizij =
      availableFaces.find(
        (f) => f.kind === "Vizij" && f.name === "Hugo - Expressive",
      ) ?? builtInFaces[0];
    const store = createPeerbotsFaceStore({
      isSilent: true,
      initialFace: hugoVizij,
      initialMessage: {
        title: "Hello",
        speech: "Hello from Vizij Hugo!",
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
