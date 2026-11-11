import type { Meta, StoryObj } from "@storybook/react-vite";
import { createPeerbotsFaceStore } from "../store/createPeerbotsFaceStore";
import { FaceStoreProvider } from "../store/FaceStoreContext";
import { FaceSettingsPanel } from "./FaceSettingsPanel";
import { FaceAudioPrompt } from "./FaceAudioPrompt";

const meta: Meta<typeof FaceSettingsPanel> = {
  title: "Face/FaceSettingsPanel",
  component: FaceSettingsPanel,
};

export default meta;
type Story = StoryObj<typeof FaceSettingsPanel>;

export const DefaultThreeColumn: Story = {
  render: () => {
    const store = createPeerbotsFaceStore({ isSilent: true });
    store.getState().setAvailableVoices([
      {
        name: "Samantha",
        voiceURI: "com.apple.voice.compact.en-US.Samantha",
        lang: "en-US",
        default: true,
      },
      {
        name: "AWS - Joanna",
        voiceURI: "aws:Joanna:neural",
        lang: "en-US",
      },
    ]);
    return (
      <FaceStoreProvider store={store}>
        <div className="p-4 bg-slate-50">
          <FaceSettingsPanel />
        </div>
      </FaceStoreProvider>
    );
  },
};

export const SingleColumnDrawer: Story = {
  render: () => {
    const store = createPeerbotsFaceStore({
      isSilent: true,
      initialSettings: {
        captions: {
          enabled: true,
          fontSize: 28,
          offset: { x: 0, y: 0 },
        },
      },
    });
    return (
      <FaceStoreProvider store={store}>
        <div className="max-w-md p-4 bg-white">
          <div className="mb-4">
            <FaceAudioPrompt position="inline" />
          </div>
          <FaceSettingsPanel inline columns={1} />
        </div>
      </FaceStoreProvider>
    );
  },
};
