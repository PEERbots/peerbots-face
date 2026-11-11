import type { Meta, StoryObj } from "@storybook/react-vite";
import { createPeerbotsFaceStore } from "../store/createPeerbotsFaceStore";
import { FaceStoreProvider } from "../store/FaceStoreContext";
import { builtInFaces } from "../types/face";
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
