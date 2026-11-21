import type { Meta, StoryObj } from "@storybook/react-vite";
import { FaceTester } from "./FaceTester";
import { FaceTesterSection } from "./FaceTesterSection";

const meta: Meta<typeof FaceTester> = {
  title: "Components/FaceTester",
  component: FaceTester,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof FaceTester>;

export const Default: Story = {};

export const Variations: Story = {
  render: () => (
    <div className="space-y-6 max-w-2xl">
      <FaceTesterSection
        defaultOpen
        labels={{ testFace: "Test Face (Expanded)" }}
      />
      <FaceTesterSection
        defaultOpen={false}
        labels={{ testFace: "Test Face (Collapsed)" }}
      />
    </div>
  ),
};
