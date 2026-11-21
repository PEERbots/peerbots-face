import { SettingsPanel } from "@peerbots/core";
import { faceCn as cn } from "../helpers/cn";
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
      ? "pbf:grid pbf:items-start pbf:gap-4 pbf:grid-cols-1"
      : "pbf:grid pbf:items-start pbf:gap-4 pbf:lg:gap-6 pbf:grid-cols-1 pbf:md:grid-cols-2 pbf:lg:grid-cols-3";

  const content = (
    <div className={cn(gridClass, className)}>
      <div className="pbf:min-w-0 pbf:h-full">
        <CharacterSelectionControls enableVizij={enableVizij} labels={uiLabels} />
      </div>
      <div className="pbf:min-w-0 pbf:h-full">
        <FacePositioningControls labels={uiLabels} />
      </div>
      <div className="pbf:min-w-0 pbf:h-full">
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
