import type { Meta, StoryObj } from "@storybook/react-vite";
import { createPeerbotsFaceStore } from "../store/createPeerbotsFaceStore";
import { FaceStoreProvider } from "../store/FaceStoreContext";
import { availableFaces, builtInFaces } from "../types/face";
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
      availableFaces.find((f) => f.kind === "Vizij" && f.name === "Hugo - Expressive") ??
      builtInFaces[0];
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
