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
  type PixiAvatar,
  type PixiCheekStyle,
  type PixiColorRole,
  type PixiEyebrowStyle,
  type PixiMouthShape,
  type VectorFaceStyleId,
} from "../types/face";
import {
  estimateVisemesFromText,
  type PollyViseme,
} from "../helpers/viseme_mapper";
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
  const [speechText, setSpeechText] = useState(
    "Hello! I am Hugo. Watch my mouth move as I speak!",
  );
  const [store] = useState(() =>
    createPeerbotsFaceStore({
      isSilent: false,
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
        speech: args.isSpeaking ? speechText : "",
        color: args.color,
        emotion: args.emotion,
      },
      isSpeaking: args.isSpeaking,
      currentAmplitude: args.isSpeaking ? 0.65 : 0,
    });
  }, [store, args.emotion, args.color, args.isSpeaking, speechText]);

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

  const handleSpeak = () => {
    const trimmed = speechText.trim();
    if (!trimmed) return;
    const current = store.getState().lastMessage;
    void store.getState().express({
      ...current,
      title: current.emotion,
      speech: trimmed,
    });
  };

  const handleSilentLipsyncDemo = () => {
    const trimmed = speechText.trim();
    if (!trimmed) return;
    const visemes = estimateVisemesFromText(trimmed);
    store.setState({
      isSpeaking: true,
      spokenVisemes: [...visemes],
    });
  };

  const handleStopSpeech = () => {
    store.getState().stopSpeech();
    store.setState({ spokenVisemes: null, isSpeaking: false, currentAmplitude: 0 });
  };

  return (
    <FaceStoreProvider store={store}>
      <div className="flex flex-col w-full h-[580px] bg-slate-950">
        <div
          className="flex flex-col gap-2 px-3 py-2 bg-slate-900 text-slate-100 text-xs border-b border-slate-800"
          role="toolbar"
          aria-label="Vizij face selector, emotions, and speech lipsync controls"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
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
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex-1 min-w-[220px] flex items-center gap-1.5">
              <span className="text-slate-400 shrink-0">Speech:</span>
              <input
                type="text"
                aria-label="Speech text for Vizij lipsync"
                value={speechText}
                onChange={(e) => setSpeechText(e.target.value)}
                className="w-full px-2 py-1 rounded bg-slate-800 text-white border border-slate-700"
              />
            </label>
            <button
              type="button"
              onClick={handleSpeak}
              className="px-2.5 py-1 rounded bg-teal-700 hover:bg-teal-600 text-white font-medium transition-colors cursor-pointer"
            >
              Speak (TTS + Visemes)
            </button>
            <button
              type="button"
              onClick={handleSilentLipsyncDemo}
              className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors cursor-pointer"
            >
              Lipsync Demo (Silent)
            </button>
            <button
              type="button"
              onClick={handleStopSpeech}
              className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white transition-colors cursor-pointer"
            >
              Stop
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

interface VisemeAuditItem {
  standard: string;
  polly: PollyViseme;
  cue: string;
}

const VISEME_AUDIT_ITEMS: readonly VisemeAuditItem[] = [
  { standard: "sil", polly: "sil", cue: "rest" },
  { standard: "PP", polly: "p", cue: "p/b/m" },
  { standard: "FF", polly: "f", cue: "f/v" },
  { standard: "TH", polly: "T", cue: "th" },
  { standard: "DD", polly: "t", cue: "t/d" },
  { standard: "kk", polly: "k", cue: "k/g" },
  { standard: "CH", polly: "S", cue: "ch/sh" },
  { standard: "SS", polly: "s", cue: "s/z" },
  { standard: "nn", polly: "l", cue: "n/l" },
  { standard: "RR", polly: "r", cue: "r" },
  { standard: "aa", polly: "a", cue: "ah" },
  { standard: "E", polly: "e", cue: "eh" },
  { standard: "ih", polly: "i", cue: "ee" },
  { standard: "oh", polly: "o", cue: "oh" },
  { standard: "ou", polly: "u", cue: "oo" },
];

const AMPLITUDE_AUDIT_LEVELS: readonly { value: number; label: string }[] = [
  { value: 0, label: "0% (Idle)" },
  { value: 0.25, label: "25% (Soft)" },
  { value: 0.5, label: "50% (Medium)" },
  { value: 0.75, label: "75% (Loud)" },
  { value: 1, label: "100% (Peak)" },
];

function LipsyncVisemeAuditView(args: PlaygroundArgs) {
  const [selectedName, setSelectedName] = useState(args.faceName);
  const [activeViseme, setActiveViseme] = useState<string>("sil");
  const [amplitude, setAmplitude] = useState<number>(0);
  const [autoCycle, setAutoCycle] = useState(false);

  useEffect(() => {
    setSelectedName(args.faceName);
  }, [args.faceName]);

  const face =
    availableFaces.find((f) => f.name === selectedName) ?? builtInFaces[0];
  const isVizij = face.kind === "Vizij";

  const [vizijStore] = useState(() =>
    createPeerbotsFaceStore({
      isSilent: true,
      initialFace: face,
      initialSettings: {
        showFullScreenButton: false,
        showScrollButton: false,
        vizijSettings: { faceExpressivity: args.expressivity },
      },
      initialMessage: {
        title: args.emotion,
        speech: "",
        color: args.color,
        emotion: args.emotion,
      },
    }),
  );

  useEffect(() => {
    vizijStore.getState().setFaceByName(selectedName);
  }, [vizijStore, selectedName]);

  useEffect(() => {
    vizijStore.setState({
      lastMessage: {
        title: args.emotion,
        speech: "",
        color: args.color,
        emotion: args.emotion,
      },
    });
  }, [vizijStore, args.emotion, args.color]);

  const applyViseme = (item: VisemeAuditItem) => {
    setActiveViseme(item.standard);
    setAmplitude(0);
    vizijStore.setState({
      isSpeaking: item.standard !== "sil",
      currentAmplitude: 0,
      spokenVisemes:
        item.standard === "sil"
          ? null
          : [{ time: 0, type: "viseme", value: item.polly }],
    });
  };

  const applyAmplitude = (val: number) => {
    setAutoCycle(false);
    setActiveViseme("sil");
    setAmplitude(val);
    vizijStore.setState({
      isSpeaking: val > 0,
      currentAmplitude: val,
      spokenVisemes: null,
    });
  };

  useEffect(() => {
    if (!autoCycle || !isVizij) return;
    let idx = 0;
    const timer = setInterval(() => {
      const item = VISEME_AUDIT_ITEMS[idx % VISEME_AUDIT_ITEMS.length];
      idx += 1;
      setActiveViseme(item.standard);
      setAmplitude(0);
      vizijStore.setState({
        isSpeaking: item.standard !== "sil",
        currentAmplitude: 0,
        spokenVisemes:
          item.standard === "sil"
            ? null
            : [{ time: 0, type: "viseme", value: item.polly }],
      });
    }, 480);
    return () => clearInterval(timer);
  }, [autoCycle, isVizij, vizijStore]);

  return (
    <div className="flex flex-col w-full min-h-[600px] bg-slate-950 text-slate-100">
      <div
        className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs"
        role="toolbar"
        aria-label="Lipsync, viseme, and amplitude audit controls"
      >
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1.5">
            <span className="text-slate-300 font-medium">Face:</span>
            <select
              aria-label="Select face for lipsync audit"
              value={selectedName}
              onChange={(e) => {
                setAutoCycle(false);
                setSelectedName(e.target.value);
              }}
              className="px-2 py-1 rounded bg-slate-800 text-white border border-slate-700"
            >
              {FACE_NAMES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
            {isVizij
              ? "Vizij: 15 Standard/Polly Visemes + Amplitude"
              : "Pixi: 5-Level Amplitude Comparison Grid"}
          </span>
        </div>

        {isVizij && (
          <button
            type="button"
            onClick={() => setAutoCycle((prev) => !prev)}
            className={`px-3 py-1 rounded font-medium transition-colors cursor-pointer ${
              autoCycle
                ? "bg-teal-700 text-white"
                : "bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700"
            }`}
          >
            {autoCycle ? "Stop Auto-Cycle" : "Auto-Cycle All 15 Visemes"}
          </button>
        )}
      </div>

      {isVizij ? (
        <div className="flex flex-col flex-1">
          <div className="h-[340px] w-full border-b border-slate-800">
            <FaceStoreProvider store={vizijStore}>
              <FaceView />
            </FaceStoreProvider>
          </div>
          <div className="p-4 space-y-4 bg-slate-900/60">
            <div>
              <div className="text-xs font-semibold text-slate-200 mb-2">
                15 Standard Vizij / Polly Visemes (click any to hold mouth pose):
              </div>
              <div className="grid grid-cols-5 sm:grid-cols-8 gap-1.5">
                {VISEME_AUDIT_ITEMS.map((item) => {
                  const isActive = activeViseme === item.standard && amplitude === 0;
                  return (
                    <button
                      key={item.standard}
                      type="button"
                      onClick={() => {
                        setAutoCycle(false);
                        applyViseme(item);
                      }}
                      className={`px-2 py-1.5 rounded text-left text-xs transition-colors cursor-pointer border ${
                        isActive
                          ? "bg-teal-700 text-white border-teal-500"
                          : "bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700"
                      }`}
                    >
                      <div className="font-semibold">{item.standard}</div>
                      <div
                        className={`text-[10px] ${
                          isActive ? "text-white" : "text-slate-300"
                        }`}
                      >
                        {item.cue} ({item.polly})
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-200">
                Amplitude:
              </span>
              {AMPLITUDE_AUDIT_LEVELS.map((lvl) => (
                <button
                  key={lvl.label}
                  type="button"
                  onClick={() => applyAmplitude(lvl.value)}
                  className={`px-2.5 py-1 rounded text-xs cursor-pointer border ${
                    amplitude === lvl.value && activeViseme === "sil"
                      ? "bg-teal-700 text-white border-teal-500"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700"
                  }`}
                >
                  {lvl.label}
                </button>
              ))}
              <label className="flex items-center gap-2 ml-2 text-xs text-slate-200">
                <span>Scrub:</span>
                <input
                  type="range"
                  aria-label="Speech amplitude scrub"
                  min={0}
                  max={1}
                  step={0.05}
                  value={amplitude}
                  onChange={(e) => applyAmplitude(Number(e.target.value))}
                />
                <span className="w-10 text-right font-mono">
                  {Math.round(amplitude * 100)}%
                </span>
              </label>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3 p-4 bg-slate-100 flex-1">
          {AMPLITUDE_AUDIT_LEVELS.map((lvl) => {
            const cardStore = createPeerbotsFaceStore({
              isSilent: true,
              initialFace: face,
              initialSettings: {
                showFullScreenButton: false,
                showScrollButton: false,
                vizijSettings: { faceExpressivity: args.expressivity },
              },
              initialMessage: {
                title: args.emotion,
                speech: lvl.value > 0 ? "Testing speech amplitude" : "",
                color: args.color,
                emotion: args.emotion,
              },
            });
            cardStore.setState({
              isSpeaking: lvl.value > 0,
              currentAmplitude: lvl.value,
            });
            return (
              <div
                key={`${face.name}-${lvl.value}-${args.color}-${args.emotion}`}
                className="flex flex-col rounded-lg overflow-hidden border border-slate-300 bg-white"
              >
                <div className="h-[220px] w-full">
                  <FaceStoreProvider store={cardStore}>
                    <FaceView isPreview />
                  </FaceStoreProvider>
                </div>
                <div className="px-2.5 py-1.5 text-xs font-semibold text-slate-900 border-t border-slate-200 flex items-center justify-between">
                  <span>{lvl.label}</span>
                  <span className="text-slate-600 font-normal">
                    {face.name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const LipsyncAndVisemeAudit: Story = {
  args: {
    faceName: "Hugo - Expressive",
    emotion: "Neutral",
    color: "Light Blue",
  },
  render: (args) => <LipsyncVisemeAuditView {...args} />,
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

const EYE_STYLES: readonly VectorFaceStyleId[] = [
  "hugo",
  "mochi",
  "pebble",
  "dash",
  "orbit",
  "pixel",
  "slate",
];

const EYEBROW_OPTIONS: readonly { label: string; value: PixiEyebrowStyle | "none" }[] = [
  { label: "None", value: "none" },
  { label: "Delicate Arch (Hugo)", value: "delicateArch" },
  { label: "Soft Arch (Pebble)", value: "softArch" },
  { label: "Thick Arch (Orbit)", value: "thickArch" },
  { label: "Flat Bar (Slate)", value: "flatBar" },
];

const CHEEK_OPTIONS: readonly { label: string; value: PixiCheekStyle | "none" }[] = [
  { label: "None", value: "none" },
  { label: "Coral Oval (Hugo)", value: "coralOval" },
  { label: "Pink Blush (Mochi)", value: "pinkBlush" },
  { label: "Warm Oval", value: "warmOval" },
];

const MOUTH_OPTIONS: readonly PixiMouthShape[] = [
  "Hugo",
  "SoftCurve",
  "Cat",
  "Equalizer",
  "PixelMatrix",
  "Capsule",
  "Arc",
  "Ellipse",
  "ZigZag",
  "Beak",
];

function PixiPartComposerStory() {
  const [eyes, setEyes] = useState<VectorFaceStyleId>("pebble");
  const [eyebrows, setEyebrows] = useState<PixiEyebrowStyle | "none">("softArch");
  const [cheeks, setCheeks] = useState<PixiCheekStyle | "none">("pinkBlush");
  const [mouth, setMouth] = useState<PixiMouthShape>("Cat");
  const [colorRole, setColorRole] = useState<PixiColorRole>("background");
  const [emotion, setEmotion] = useState<PeerbotsEmotion>("Happy");
  const [color, setColor] = useState<PeerbotsColor>("Light Blue");
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [store] = useState(() =>
    createPeerbotsFaceStore({
      isSilent: true,
      initialMessage: {
        title: "Custom",
        speech: "",
        color: "Light Blue",
        emotion: "Happy",
      },
    }),
  );

  useEffect(() => {
    const composedFace: PixiAvatar = {
      kind: "PixiFace",
      name: "Custom Composed",
      type: "avatar",
      eyes: { kind: "vector", style: eyes },
      eyebrows: eyebrows === "none" ? null : eyebrows,
      cheeks: cheeks === "none" ? null : { kind: "vector", style: cheeks },
      mouth,
      colorRole,
    };
    store.getState().setFace(composedFace);
    store.setState({
      lastMessage: {
        title: emotion,
        speech: isSpeaking ? "Mixing and matching parts!" : "",
        color,
        emotion,
      },
      isSpeaking,
      currentAmplitude: isSpeaking ? 0.72 : 0,
    });
  }, [eyes, eyebrows, cheeks, mouth, colorRole, emotion, color, isSpeaking, store]);

  return (
    <div className="flex flex-col w-full min-h-[540px] bg-slate-950 text-slate-100">
      <div
        className="flex flex-wrap items-center gap-3 px-4 py-3 bg-slate-900 border-b border-slate-800 text-xs"
        role="toolbar"
        aria-label="Pixi face part composer controls"
      >
        <label className="flex items-center gap-1.5">
          <span className="text-slate-200 font-medium">Eyes:</span>
          <select
            aria-label="Eyes style"
            value={eyes}
            onChange={(e) => setEyes(e.target.value as VectorFaceStyleId)}
            className="px-2 py-1 rounded bg-slate-800 text-white border border-slate-700"
          >
            {EYE_STYLES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-1.5">
          <span className="text-slate-200 font-medium">Eyebrows:</span>
          <select
            aria-label="Eyebrows style"
            value={eyebrows}
            onChange={(e) => setEyebrows(e.target.value as PixiEyebrowStyle | "none")}
            className="px-2 py-1 rounded bg-slate-800 text-white border border-slate-700"
          >
            {EYEBROW_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-1.5">
          <span className="text-slate-200 font-medium">Cheeks:</span>
          <select
            aria-label="Cheeks style"
            value={cheeks}
            onChange={(e) => setCheeks(e.target.value as PixiCheekStyle | "none")}
            className="px-2 py-1 rounded bg-slate-800 text-white border border-slate-700"
          >
            {CHEEK_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-1.5">
          <span className="text-slate-200 font-medium">Mouth:</span>
          <select
            aria-label="Mouth shape"
            value={mouth}
            onChange={(e) => setMouth(e.target.value as PixiMouthShape)}
            className="px-2 py-1 rounded bg-slate-800 text-white border border-slate-700"
          >
            {MOUTH_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-1.5">
          <span className="text-slate-200 font-medium">Color Role:</span>
          <select
            aria-label="Color role"
            value={colorRole}
            onChange={(e) => setColorRole(e.target.value as PixiColorRole)}
            className="px-2 py-1 rounded bg-slate-800 text-white border border-slate-700"
          >
            <option value="background">Background</option>
            <option value="accent">Accent (Dark Visor)</option>
          </select>
        </label>

        <label className="flex items-center gap-1.5">
          <span className="text-slate-200 font-medium">Emotion:</span>
          <select
            aria-label="Emotion"
            value={emotion}
            onChange={(e) => setEmotion(e.target.value as PeerbotsEmotion)}
            className="px-2 py-1 rounded bg-slate-800 text-white border border-slate-700"
          >
            {PEERBOTS_EMOTIONS.map((emo) => (
              <option key={emo} value={emo}>
                {emo}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-1.5">
          <span className="text-slate-200 font-medium">Color:</span>
          <select
            aria-label="Color"
            value={color}
            onChange={(e) => setColor(e.target.value as PeerbotsColor)}
            className="px-2 py-1 rounded bg-slate-800 text-white border border-slate-700"
          >
            {PEERBOTS_COLORS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() => setIsSpeaking((prev) => !prev)}
          className={`px-3 py-1 rounded font-medium transition-colors cursor-pointer ${
            isSpeaking
              ? "bg-teal-700 text-white"
              : "bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700"
          }`}
        >
          {isSpeaking ? "Stop Speaking" : "Simulate Speech"}
        </button>
      </div>

      <FaceStoreProvider store={store}>
        <div className="w-full h-[460px]">
          <FaceView />
        </div>
      </FaceStoreProvider>
    </div>
  );
}

export const PixiPartComposer: Story = {
  render: () => <PixiPartComposerStory />,
};
