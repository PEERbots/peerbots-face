import {
  Field,
  Select,
  SliderWithNumberField,
  SettingsPanel,
  Separator,
  Switch,
} from "@peerbots/core";
import type { SpeechQueueMode } from "../types/face";
import { resolveFaceUiLabels, type FaceUiLabels } from "../types/labels";
import { useFaceStore } from "../store/FaceStoreContext";
import { FieldGroup } from "./FieldGroup";

export interface FaceBehaviorControlsProps {
  labels?: Partial<FaceUiLabels>;
}

export function FaceBehaviorControls({
  labels,
}: FaceBehaviorControlsProps = {}) {
  const uiLabels = resolveFaceUiLabels(labels);
  const faceSettings = useFaceStore((state) => state.faceSettings);
  const setFaceSettings = useFaceStore((state) => state.setFaceSettings);

  return (
    <SettingsPanel title={uiLabels.faceSettings} headingLevel={4}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className="font-bold text-sm text-slate-800">
            {uiLabels.onFaceButtons}
          </span>
          <Field
            label={uiLabels.showFullScreenButton}
            labelPlacement="left"
            labelWeight="normal"
            className="flex-row items-center justify-between"
          >
            <Switch
              aria-label={uiLabels.showFullScreenButton}
              checked={faceSettings.showFullScreenButton}
              onChange={(checked) => {
                setFaceSettings({ showFullScreenButton: checked });
              }}
            />
          </Field>
          <Field
            label={uiLabels.showScrollButton}
            labelPlacement="left"
            labelWeight="normal"
            className="flex-row items-center justify-between"
          >
            <Switch
              aria-label={uiLabels.showScrollButton}
              checked={faceSettings.showScrollButton}
              onChange={(checked) => {
                setFaceSettings({ showScrollButton: checked });
              }}
            />
          </Field>
        </div>

        <Separator />

        <div className="flex flex-col gap-2">
          <span className="font-bold text-sm text-slate-800">
            {uiLabels.speechBehavior}
          </span>
          <Field label={uiLabels.newButtonSpeech} className="flex-col gap-1">
            <Select
              aria-label={uiLabels.newButtonSpeech}
              className="w-full"
              value={faceSettings.speechQueueMode || "interrupt"}
              onChange={(val) => {
                if (val) {
                  setFaceSettings({
                    speechQueueMode: val as SpeechQueueMode,
                  });
                }
              }}
              options={[
                {
                  label: uiLabels.interruptSpeech,
                  value: "interrupt",
                },
                {
                  label: uiLabels.queueSpeech,
                  value: "queue",
                },
              ]}
            />
          </Field>
        </div>

        <Separator />

        <div className="flex flex-col gap-3">
          <Field
            label={uiLabels.captions}
            labelPlacement="left"
            labelWeight="bold"
            className="flex-row items-center justify-between"
          >
            <Switch
              aria-label={uiLabels.captions}
              checked={faceSettings.captions?.enabled ?? false}
              onChange={(checked: boolean) => {
                setFaceSettings({
                  captions: {
                    ...faceSettings.captions,
                    enabled: checked,
                  },
                });
              }}
            />
          </Field>

          {faceSettings.captions?.enabled && (
            <div className="flex flex-col gap-4 mt-1">
              <FieldGroup label={uiLabels.fontSize}>
                <SliderWithNumberField
                  aria-label={uiLabels.fontSize}
                  min={10}
                  max={100}
                  step={1}
                  value={faceSettings.captions?.fontSize ?? 32}
                  onChange={(val) => {
                    setFaceSettings({
                      captions: {
                        ...faceSettings.captions,
                        fontSize: val,
                      },
                    });
                  }}
                />
              </FieldGroup>

              <FieldGroup label={uiLabels.horizontalOffset}>
                <SliderWithNumberField
                  aria-label={uiLabels.horizontalOffset}
                  min={-400}
                  max={400}
                  step={1}
                  value={faceSettings.captions?.offset?.x ?? 0}
                  onChange={(val) => {
                    setFaceSettings({
                      captions: {
                        ...faceSettings.captions,
                        offset: {
                          x: val,
                          y: faceSettings.captions?.offset?.y ?? 0,
                        },
                      },
                    });
                  }}
                />
              </FieldGroup>

              <FieldGroup label={uiLabels.verticalPosition}>
                <SliderWithNumberField
                  aria-label={uiLabels.verticalPosition}
                  min={-50}
                  max={50}
                  step={1}
                  value={faceSettings.captions?.offset?.y ?? 0}
                  onChange={(val) => {
                    setFaceSettings({
                      captions: {
                        ...faceSettings.captions,
                        offset: {
                          x: faceSettings.captions?.offset?.x ?? 0,
                          y: val,
                        },
                      },
                    });
                  }}
                />
              </FieldGroup>
            </div>
          )}
        </div>
      </div>
    </SettingsPanel>
  );
}

export const ControlSettingsSection = FaceBehaviorControls;
