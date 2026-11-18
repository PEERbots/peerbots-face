import { SettingsPanel } from "@peerbots/core";
import { resolveFaceUiLabels, type FaceUiLabels } from "../types/labels";
import { FaceTester, type FaceTesterProps } from "./FaceTester";

export interface FaceTesterSectionProps extends FaceTesterProps {
  defaultOpen?: boolean;
  collapsible?: boolean;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  labels?: Partial<FaceUiLabels>;
}

export function FaceTesterSection({
  defaultOpen = false,
  collapsible = true,
  headingLevel = 4,
  labels,
  onSendMessage,
}: FaceTesterSectionProps = {}) {
  const uiLabels = resolveFaceUiLabels(labels);
  return (
    <SettingsPanel
      title={uiLabels.testFace}
      collapsible={collapsible}
      defaultOpen={defaultOpen}
      headingLevel={headingLevel}
    >
      <FaceTester labels={uiLabels} onSendMessage={onSendMessage} />
    </SettingsPanel>
  );
}

export default FaceTesterSection;
