import { useEffect } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Text } from "@peerbots/core";
import { useFaceStore } from "../store/FaceStoreContext";
import type { AmplitudePoint } from "../types/face";
import { AmplitudeGraph } from "./AmplitudeGraph";

const meta: Meta<typeof AmplitudeGraph> = {
  title: "Components/AmplitudeGraph",
  component: AmplitudeGraph,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof AmplitudeGraph>;

const mockData: AmplitudePoint[] = Array.from({ length: 50 }, (_, i) => ({
  time: i * 20,
  value: Math.abs(Math.sin(i / 5)) * (1 - i / 50),
}));

const mockExtrema: AmplitudePoint[] = [
  { time: 100, value: 0.8 },
  { time: 300, value: 0.1 },
  { time: 500, value: 0.6 },
  { time: 700, value: 0.05 },
];

function AmplitudeMockWrapper({
  isSpeaking,
  currentAmplitude,
  hasData,
}: {
  isSpeaking: boolean;
  currentAmplitude: number;
  hasData: boolean;
}) {
  useEffect(() => {
    useFaceStore.setState({
      isSpeaking,
      currentAmplitude,
      amplitudeData: hasData ? mockData : [],
      amplitudeExtrema: hasData ? mockExtrema : [],
    });
    return () => {
      useFaceStore.setState({
        isSpeaking: false,
        currentAmplitude: 0,
        amplitudeData: [],
        amplitudeExtrema: [],
      });
    };
  }, [isSpeaking, currentAmplitude, hasData]);

  return <AmplitudeGraph />;
}

export const Default: Story = {
  render: () => (
    <AmplitudeMockWrapper isSpeaking currentAmplitude={0.45} hasData />
  ),
};

export const Variations: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <Text variant="small" className="font-bold underline uppercase">
          Idle State (No Data)
        </Text>
        <AmplitudeMockWrapper
          isSpeaking={false}
          currentAmplitude={0}
          hasData={false}
        />
      </div>
      <div>
        <Text variant="small" className="font-bold underline uppercase">
          Live Speaking (No Historical Data)
        </Text>
        <AmplitudeMockWrapper
          isSpeaking
          currentAmplitude={0.8}
          hasData={false}
        />
      </div>
    </div>
  ),
};
