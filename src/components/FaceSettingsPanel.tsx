import { SettingsPanel, cn } from "@peerbots/core";
import { resolveFaceUiLabels, type FaceUiLabels } from "../types/labels";
import { CharacterSelectionControls } from "./CharacterSelectionControls";
import { FacePositioningControls } from "./FacePositioningControls";
import { FaceBehaviorControls } from "./FaceBehaviorControls";

export interface FaceSettingsPanelProps {
  inline?: boolean;
  enableVizij?: boolean;
  columns?: 1 | 3;
  labels?: Partial<FaceUiLabels>;
  className?: string;
}

export function FaceSettingsPanel({
  inline = false,
  enableVizij = true,
  columns = 3,
  labels,
  className,
}: FaceSettingsPanelProps = {}) {
  const uiLabels = resolveFaceUiLabels(labels);

  const gridClass =
    columns === 1
      ? "grid items-start gap-4 grid-cols-1"
      : "grid items-start gap-4 lg:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3";

  const content = (
    <div className={cn(gridClass, className)}>
      <div className="min-w-0 h-full">
        <CharacterSelectionControls enableVizij={enableVizij} labels={uiLabels} />
      </div>
      <div className="min-w-0 h-full">
        <FacePositioningControls labels={uiLabels} />
      </div>
      <div className="min-w-0 h-full">
        <FaceBehaviorControls labels={uiLabels} />
      </div>
    </div>
  );

  if (inline) {
    return content;
  }

  return <SettingsPanel title={uiLabels.faceSettings}>{content}</SettingsPanel>;
}

export const FaceSettingsControl = FaceSettingsPanel;
