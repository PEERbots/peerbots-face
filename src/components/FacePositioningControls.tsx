import {
  Field,
  SliderWithNumberField,
  Switch,
  SettingsPanel,
  Button,
  Separator,
  Icon,
} from "@peerbots/core";
import { useFaceStore } from "../store/FaceStoreContext";
import { resolveFaceUiLabels, type FaceUiLabels } from "../types/labels";
import { FieldGroup } from "./FieldGroup";

export interface FacePositioningControlsProps {
  labels?: Partial<FaceUiLabels>;
}

export function FacePositioningControls({
  labels,
}: FacePositioningControlsProps = {}) {
  const uiLabels = resolveFaceUiLabels(labels);
  const faceSettings = useFaceStore((state) => state.faceSettings);
  const setFaceSettings = useFaceStore((state) => state.setFaceSettings);
  const resetPositioning = useFaceStore((state) => state.resetPositioning);

  const isModified =
    faceSettings.zoom !== 1 ||
    (faceSettings.offset?.x ?? 0) !== 0 ||
    (faceSettings.offset?.y ?? 0) !== 0 ||
    faceSettings.rotation !== 0;

  return (
    <SettingsPanel title={uiLabels.positioning} headingLevel={4}>
      <div className="space-y-4">
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <Field
            label={uiLabels.autoRotate}
            labelPlacement="left"
            labelWeight="normal"
            className="flex-row items-center gap-2 mb-0 !w-auto"
          >
            <Switch
              aria-label={uiLabels.autoRotate}
              checked={faceSettings.autoRotate}
              onChange={(checked) => {
                setFaceSettings({ autoRotate: checked });
              }}
            />
          </Field>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="p-1.5 text-xs whitespace-nowrap"
              onClick={() => {
                setFaceSettings({
                  rotation: (faceSettings.rotation + 90) % 360,
                });
              }}
              leftIcon={<Icon name="arrowPath" className="h-3.5 w-3.5" />}
            >
              {uiLabels.rotate}
            </Button>

            {isModified && (
              <Button
                variant="ghost"
                size="sm"
                className="p-1.5 text-xs whitespace-nowrap"
                onClick={resetPositioning}
                leftIcon={
                  <Icon name="arrowUturnLeft" className="h-3.5 w-3.5" />
                }
              >
                {uiLabels.reset}
              </Button>
            )}
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-4">
          <FieldGroup
            label={uiLabels.zoom}
            icon={<Icon name="magnifyingGlassPlus" />}
          >
            <SliderWithNumberField
              aria-label={uiLabels.zoom}
              min={0.1}
              max={3}
              step={0.05}
              value={faceSettings.zoom}
              onChange={(val) => {
                setFaceSettings({ zoom: val });
              }}
            />
          </FieldGroup>

          <FieldGroup
            label={uiLabels.horizontalOffset}
            icon={<Icon name="arrowsRightLeft" />}
          >
            <SliderWithNumberField
              aria-label={uiLabels.horizontalOffset}
              min={-1000}
              max={1000}
              value={faceSettings.offset?.x ?? 0}
              onChange={(val) => {
                setFaceSettings({
                  offset: {
                    x: val,
                    y: faceSettings.offset?.y ?? 0,
                  },
                });
              }}
            />
          </FieldGroup>

          <FieldGroup
            label={uiLabels.verticalOffset}
            icon={<Icon name="arrowsUpDown" />}
          >
            <SliderWithNumberField
              aria-label={uiLabels.verticalOffset}
              min={-1000}
              max={1000}
              value={faceSettings.offset?.y ?? 0}
              onChange={(val) => {
                setFaceSettings({
                  offset: {
                    x: faceSettings.offset?.x ?? 0,
                    y: val,
                  },
                });
              }}
            />
          </FieldGroup>
        </div>
      </div>
    </SettingsPanel>
  );
}

export const FacePositioningSection = FacePositioningControls;
