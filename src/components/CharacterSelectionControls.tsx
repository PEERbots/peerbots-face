import {
  Select,
  Field,
  SettingsPanel,
  Button,
  Input,
  Separator,
  SliderWithNumberField,
  TabRadio,
} from "@peerbots/core";
import {
  defaultFaceSettings,
  getFaceCapabilities,
  type PixiSettings,
  type VizijFace,
  type VizijSettings,
} from "../types/face";
import { resolveFaceUiLabels, type FaceUiLabels } from "../types/labels";
import { useFaceStore } from "../store/FaceStoreContext";
import { getLanguageName } from "../helpers/voice_helpers";
import { FieldGroup } from "./FieldGroup";
import { VoiceSelector } from "./VoiceSelector";
import { PoweredByVizij } from "./PoweredByVizij";

export interface CharacterSelectionControlsProps {
  enableVizij?: boolean;
  labels?: Partial<FaceUiLabels>;
}

export function CharacterSelectionControls({
  enableVizij = true,
  labels,
}: CharacterSelectionControlsProps = {}) {
  const uiLabels = resolveFaceUiLabels(labels);
  const faceSettings = useFaceStore((state) => state.faceSettings);
  const availableFaces = useFaceStore((state) => state.availableFaces);
  const availableVoices = useFaceStore((state) => state.availableVoices);
  const selectedFace = useFaceStore((state) => state.selectedFace);
  const getSelectedVoice = useFaceStore((state) => state.getSelectedVoice);
  const selectedVoiceUri = useFaceStore((state) => state.selectedVoiceUri);
  const setLanguage = useFaceStore((state) => state.setLanguage);
  const setVoice = useFaceStore((state) => state.setVoice);
  const setFace = useFaceStore((state) => state.setFace);
  const setFaceSettings = useFaceStore((state) => state.setFaceSettings);
  const speechAllowed = useFaceStore((state) => state.speechAllowed);
  const unlockAudio = useFaceStore((state) => state.unlockAudio);

  const currentVoiceUri =
    selectedVoiceUri || getSelectedVoice()?.voiceURI || "";

  const selectableFaces = enableVizij
    ? availableFaces
    : availableFaces.filter((f) => f.kind !== "Vizij");

  const caps = getFaceCapabilities(selectedFace);

  return (
    <SettingsPanel title={uiLabels.characterSelection} headingLevel={4}>
      <div className="pbf:space-y-4">
        {!speechAllowed && (
          <>
            <div className="pbf:flex">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  void unlockAudio();
                }}
              >
                {uiLabels.allowSpeech}
              </Button>
            </div>
            <Separator />
          </>
        )}

        <VoiceSelector
          voices={availableVoices}
          selectedVoiceUri={currentVoiceUri}
          selectedLanguage={faceSettings.selectedLanguage}
          labels={uiLabels}
          onLanguageChange={(newLang: string) => {
            setLanguage(newLang);
            const firstVoice = availableVoices.find(
              (v) => getLanguageName(v.lang) === newLang,
            );
            if (firstVoice) {
              setVoice(firstVoice.voiceURI);
            }
          }}
          onVoiceChange={(newVoiceUri: string) => {
            setVoice(newVoiceUri);
          }}
        />

        <Field label={uiLabels.face} className="pbf:flex-col pbf:gap-1">
          <Select
            aria-label={uiLabels.face}
            className="pbf:w-full"
            value={selectedFace ? selectedFace.name : "Hugo"}
            onChange={(selectedName) => {
              const found = selectableFaces.find(
                (f) => f.name === String(selectedName),
              );
              if (found) {
                setFace(found);
              }
            }}
            options={selectableFaces.map((face) => ({
              label: face.name,
              value: face.name,
            }))}
          />
        </Field>

        {selectedFace?.name === "Custom Face" && (
          <Field label={uiLabels.uploadGlb} className="pbf:flex-col pbf:gap-1">
            <Input
              aria-label={uiLabels.uploadGlb}
              type="file"
              accept=".glb"
              className="pbf:w-full pbf:text-sm pbf:text-slate-900"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && selectedFace?.kind === "Vizij") {
                  const url = URL.createObjectURL(file);
                  const updatedFace: VizijFace = {
                    ...selectedFace,
                    assetBundle: {
                      ...selectedFace.assetBundle,
                      glb: {
                        kind: "url",
                        src: url,
                        aggressiveImport: true,
                      },
                    },
                  };
                  setFace(updatedFace);
                }
              }}
            />
          </Field>
        )}

        {selectedFace && (
          <div className="pbf:py-1.5 pbf:px-3 pbf:border-l-2 pbf:rtl:border-l-0 pbf:rtl:border-r-2 pbf:border-teal-700/30 pbf:bg-slate-50 pbf:rounded-r-md">
            <span className="pbf:text-[11px] pbf:font-bold pbf:text-slate-700 pbf:uppercase pbf:tracking-wider pbf:mb-1.5 pbf:block">
              {uiLabels.faceCapabilities}
            </span>
            <div className="pbf:flex pbf:flex-row pbf:flex-wrap pbf:gap-x-4 pbf:gap-y-2">
              <div className="pbf:flex pbf:items-start pbf:gap-1.5 pbf:min-w-fit">
                <span
                  aria-hidden="true"
                  className={`pbf:mt-1 pbf:w-2 pbf:h-2 pbf:rounded-full ${
                    caps.canExpressColor ? "pbf:bg-emerald-600" : "pbf:bg-slate-400"
                  }`}
                />
                <div className="pbf:flex pbf:flex-col">
                  <span className="pbf:text-xs pbf:font-semibold pbf:text-slate-800">
                    {uiLabels.color}
                  </span>
                  {typeof caps.canExpressColor === "string" && (
                    <span className="pbf:text-[11px] pbf:text-slate-600">
                      {caps.canExpressColor}
                    </span>
                  )}
                </div>
              </div>

              <div className="pbf:flex pbf:items-start pbf:gap-1.5 pbf:min-w-fit">
                <span
                  aria-hidden="true"
                  className={`pbf:mt-1 pbf:w-2 pbf:h-2 pbf:rounded-full ${
                    caps.canExpressEmotion ? "pbf:bg-emerald-600" : "pbf:bg-slate-400"
                  }`}
                />
                <div className="pbf:flex pbf:flex-col">
                  <span className="pbf:text-xs pbf:font-semibold pbf:text-slate-800">
                    {uiLabels.emotion}
                  </span>
                  {typeof caps.canExpressEmotion === "string" && (
                    <span className="pbf:text-[11px] pbf:text-slate-600">
                      {caps.canExpressEmotion}
                    </span>
                  )}
                </div>
              </div>

              <div className="pbf:flex pbf:items-start pbf:gap-1.5 pbf:min-w-fit">
                <span
                  aria-hidden="true"
                  className={`pbf:mt-1 pbf:w-2 pbf:h-2 pbf:rounded-full ${
                    caps.canLipSync ? "pbf:bg-emerald-600" : "pbf:bg-slate-400"
                  }`}
                />
                <div className="pbf:flex pbf:flex-col">
                  <span className="pbf:text-xs pbf:font-semibold pbf:text-slate-800">
                    {uiLabels.speech}
                  </span>
                  {typeof caps.canLipSync === "string" && (
                    <span className="pbf:text-[11px] pbf:text-slate-600">
                      {caps.canLipSync}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {enableVizij && selectedFace?.kind === "Vizij" && (
          <>
            <Separator />
            <div className="pbf:space-y-3">
              <div className="pbf:flex pbf:items-center pbf:justify-between">
                <span className="pbf:font-bold pbf:text-sm pbf:text-slate-800">
                  {uiLabels.faceSpecificSettings}
                </span>
                <PoweredByVizij poweredByLabel={uiLabels.poweredBy} />
              </div>
              <FieldGroup label={uiLabels.faceExpressivity}>
                <SliderWithNumberField
                  aria-label={uiLabels.faceExpressivity}
                  min={0}
                  max={1}
                  step={0.05}
                  value={faceSettings.vizijSettings?.faceExpressivity ?? 1}
                  onChange={(val) => {
                    const vizijSettings = (faceSettings.vizijSettings ??
                      defaultFaceSettings.vizijSettings) as VizijSettings;
                    setFaceSettings({
                      vizijSettings: {
                        ...vizijSettings,
                        faceExpressivity: val,
                      },
                    });
                  }}
                />
              </FieldGroup>
            </div>
          </>
        )}

        {selectedFace?.kind === "PixiFace" && (
          <>
            <Separator />
            <div className="pbf:space-y-3">
              <span className="pbf:font-bold pbf:text-sm pbf:text-slate-800 pbf:block">
                {uiLabels.faceSpecificSettings}
              </span>
              {selectedFace.type === "avatar" && (
                <div className="pbf:flex pbf:flex-col pbf:gap-3">
                  <Field
                    label={uiLabels.eyes}
                    labelPlacement="left"
                    className="pbf:flex-row pbf:items-center pbf:justify-between"
                  >
                    <TabRadio
                      aria-label={uiLabels.eyes}
                      options={[
                        { value: "default", label: uiLabels.defaultOption },
                        { value: "none", label: uiLabels.noneOption },
                      ]}
                      value={faceSettings.pixiSettings?.eyeDisplay ?? "default"}
                      onChange={(val) => {
                        const pixiSettings = (faceSettings.pixiSettings ??
                          defaultFaceSettings.pixiSettings) as PixiSettings;
                        setFaceSettings({
                          pixiSettings: {
                            ...pixiSettings,
                            eyeDisplay:
                              (val as "default" | "none") || "default",
                          },
                        });
                      }}
                    />
                  </Field>
                  <Field
                    label={uiLabels.mouth}
                    labelPlacement="left"
                    className="pbf:flex-row pbf:items-center pbf:justify-between"
                  >
                    <TabRadio
                      aria-label={uiLabels.mouth}
                      options={[
                        { value: "default", label: uiLabels.defaultOption },
                        { value: "none", label: uiLabels.noneOption },
                      ]}
                      value={
                        faceSettings.pixiSettings?.mouthDisplay ?? "default"
                      }
                      onChange={(val) => {
                        const pixiSettings = (faceSettings.pixiSettings ??
                          defaultFaceSettings.pixiSettings) as PixiSettings;
                        setFaceSettings({
                          pixiSettings: {
                            ...pixiSettings,
                            mouthDisplay:
                              (val as "default" | "none") || "default",
                          },
                        });
                      }}
                    />
                  </Field>
                  <Field
                    label={uiLabels.cheeks}
                    labelPlacement="left"
                    className="pbf:flex-row pbf:items-center pbf:justify-between"
                  >
                    <TabRadio
                      aria-label={uiLabels.cheeks}
                      options={[
                        { value: "default", label: uiLabels.defaultOption },
                        { value: "none", label: uiLabels.noneOption },
                      ]}
                      value={
                        faceSettings.pixiSettings?.cheekDisplay ?? "default"
                      }
                      onChange={(val) => {
                        const pixiSettings = (faceSettings.pixiSettings ??
                          defaultFaceSettings.pixiSettings) as PixiSettings;
                        setFaceSettings({
                          pixiSettings: {
                            ...pixiSettings,
                            cheekDisplay:
                              (val as "default" | "none") || "default",
                          },
                        });
                      }}
                    />
                  </Field>
                </div>
              )}

              {selectedFace.type === "text" && (
                <Field
                  label={uiLabels.emotionDisplay}
                  labelPlacement="left"
                  className="pbf:flex-row pbf:items-center pbf:justify-between"
                >
                  <TabRadio
                    aria-label={uiLabels.emotionDisplay}
                    options={[
                      { value: "emoticon", label: uiLabels.emoticon },
                      { value: "emoji", label: uiLabels.emoji },
                      { value: "none", label: uiLabels.noneOption },
                    ]}
                    value={
                      faceSettings.pixiSettings?.emotionDisplay ?? "emoticon"
                    }
                    onChange={(val) => {
                      const pixiSettings = (faceSettings.pixiSettings ??
                        defaultFaceSettings.pixiSettings) as PixiSettings;
                      setFaceSettings({
                        pixiSettings: {
                          ...pixiSettings,
                          emotionDisplay:
                            (val as "emoticon" | "emoji" | "none") ||
                            "emoticon",
                        },
                      });
                    }}
                  />
                </Field>
              )}
            </div>
          </>
        )}
      </div>
    </SettingsPanel>
  );
}

export const CharacterSelectionSection = CharacterSelectionControls;
