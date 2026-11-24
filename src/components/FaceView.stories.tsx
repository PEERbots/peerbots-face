import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { createPeerbotsFaceStore } from "../store/createPeerbotsFaceStore";
import { FaceStoreProvider } from "../store/FaceStoreContext";
import {
  PEERBOTS_COLORS,
  PEERBOTS_EMOTIONS,
  availableFaces,
  builtInFaces,
  createCustomVizijFace,
  includedVizijFaces,
  type PeerbotsColor,
  type PeerbotsEmotion,
} from "../types/face";
import { FaceView } from "./FaceView";

interface PlaygroundArgs {
  faceName: string;
  emotion: PeerbotsEmotion;
  color: PeerbotsColor;
  isSpeaking: boolean;
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
        speech: args.isSpeaking ? "Hello! Testing smooth expressions." : "",
        color: args.color,
        emotion: args.emotion,
      },
      isSpeaking: args.isSpeaking,
      currentAmplitude: args.isSpeaking ? 0.65 : 0,
    });
  }, [store, args.emotion, args.color, args.isSpeaking]);

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
    isSpeaking: {
      control: "boolean",
      description: "Toggle between idle and speaking",
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
    isSpeaking: false,
    expressivity: 1,
    zoom: 1,
    rotation: 0,
  },
};

export default meta;
type Story = StoryObj<PlaygroundArgs>;

const VIZIJ_FACE_NAMES = includedVizijFaces
  .filter((f) => f.name !== "Custom Face")
  .map((f) => f.name);

function VizijFacePlayground(args: PlaygroundArgs) {
  const initialVizij =
    includedVizijFaces.find((f) => f.name === args.faceName) ??
    includedVizijFaces[0];

  const [selectedVizijName, setSelectedVizijName] = useState(initialVizij.name);
  const [store] = useState(() =>
    createPeerbotsFaceStore({
      isSilent: true,
      initialFace: initialVizij,
      initialMessage: {
        title: args.emotion,
        speech: "",
        color: args.color,
        emotion: args.emotion,
      },
    }),
  );

  useEffect(() => {
    if (VIZIJ_FACE_NAMES.includes(args.faceName)) {
      setSelectedVizijName(args.faceName);
      store.getState().setFaceByName(args.faceName);
    }
  }, [store, args.faceName]);

  useEffect(() => {
    store.setState({
      lastMessage: {
        title: args.emotion,
        speech: args.isSpeaking ? "Hello! Testing Vizij face rig." : "",
        color: args.color,
        emotion: args.emotion,
      },
      isSpeaking: args.isSpeaking,
      currentAmplitude: args.isSpeaking ? 0.65 : 0,
    });
  }, [store, args.emotion, args.color, args.isSpeaking]);

  useEffect(() => {
    store.getState().setFaceSettings({
      zoom: args.zoom,
      rotation: args.rotation,
      vizijSettings: { faceExpressivity: args.expressivity },
    });
  }, [store, args.zoom, args.rotation, args.expressivity]);

  const handleSelectVizij = (name: string) => {
    setSelectedVizijName(name);
    store.getState().setFaceByName(name);
  };

  const handleUploadGlb = (file: File | null) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setSelectedVizijName(file.name);
    store.getState().setFace(createCustomVizijFace(url));
  };

  return (
    <FaceStoreProvider store={store}>
      <div className="flex flex-col w-full h-[560px] bg-slate-950">
        <div
          className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-900 text-slate-100 text-xs border-b border-slate-800"
          role="toolbar"
          aria-label="Vizij face selector and emotion controls"
        >
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5">
              <span className="text-slate-400">Vizij Face:</span>
              <select
                aria-label="Select Vizij face"
                value={
                  VIZIJ_FACE_NAMES.includes(selectedVizijName)
                    ? selectedVizijName
                    : ""
                }
                onChange={(e) => handleSelectVizij(e.target.value)}
                className="px-2 py-1 rounded bg-slate-800 text-white border border-slate-700"
              >
                {VIZIJ_FACE_NAMES.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer">
              Upload .glb
              <input
                type="file"
                accept=".glb"
                aria-label="Upload custom Vizij GLB file"
                className="sr-only"
                onChange={(e) =>
                  handleUploadGlb(e.target.files?.[0] ?? null)
                }
              />
            </label>
          </div>
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
            <button
              type="button"
              onClick={() => store.getState().triggerBlink()}
              className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white transition-colors cursor-pointer"
            >
              Blink
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <FaceView />
        </div>
      </div>
    </FaceStoreProvider>
  );
}

export const InteractivePlayground: Story = {
  render: (args) => <InteractiveFaceStory {...args} />,
};

export const VizijPlayground: Story = {
  args: {
    faceName: "Hugo - Expressive",
    emotion: "Neutral",
    color: "Light Blue",
  },
  argTypes: {
    faceName: {
      control: "select",
      options: VIZIJ_FACE_NAMES,
      description: "Vizij GLB face preset to display",
    },
  },
  render: (args) => <VizijFacePlayground {...args} />,
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
