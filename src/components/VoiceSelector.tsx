import { useMemo } from "react";
import { Select, Field, cn } from "@peerbots/core";
import type { FaceVoice } from "../types/speech";
import {
  formatVoiceDisplayName,
  findMatchingVoice,
  getLanguageName,
} from "../helpers/voice_helpers";
import { resolveFaceUiLabels, type FaceUiLabels } from "../types/labels";

export interface VoiceSelectorProps {
  voices: readonly FaceVoice[];
  selectedVoiceUri: string | null | undefined;
  selectedLanguage: string | null | undefined;
  onVoiceChange: (voiceUri: string) => void;
  onLanguageChange?: (language: string) => void;
  labels?: Partial<FaceUiLabels>;
  className?: string;
}

export function VoiceSelector({
  voices,
  selectedVoiceUri,
  selectedLanguage,
  onVoiceChange,
  onLanguageChange,
  labels,
  className,
}: VoiceSelectorProps) {
  const uiLabels = resolveFaceUiLabels(labels);

  const languages = useMemo(() => {
    const unique = new Set(
      voices.map((v) => getLanguageName(v.lang)).filter(Boolean),
    );
    if (selectedLanguage && !unique.has(selectedLanguage)) {
      unique.add(selectedLanguage);
    }
    if (unique.size === 0) {
      unique.add("English");
    }
    return Array.from(unique)
      .sort()
      .map((langName) => ({
        label: langName,
        value: langName,
      }));
  }, [voices, selectedLanguage]);

  const filteredVoices = useMemo(() => {
    const list = voices
      .filter(
        (v) =>
          !selectedLanguage || getLanguageName(v.lang) === selectedLanguage,
      )
      .map((v) => ({
        displayName: formatVoiceDisplayName(v.name || v.voiceURI),
        voiceURI: v.voiceURI,
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
      .map((voice) => ({
        label: voice.displayName,
        value: voice.voiceURI,
      }));

    if (list.length === 0) {
      return [
        {
          label: "System Default Voice",
          value: selectedVoiceUri || "default",
        },
      ];
    }
    return list;
  }, [voices, selectedLanguage, selectedVoiceUri]);

  const activeVoiceValue = useMemo(() => {
    if (!selectedVoiceUri) {
      return filteredVoices[0]?.value ?? "";
    }
    const matched = findMatchingVoice(
      filteredVoices.map((v) => ({ name: v.label, voiceURI: v.value })),
      selectedVoiceUri,
    );
    return matched ? matched.voiceURI : selectedVoiceUri;
  }, [selectedVoiceUri, filteredVoices]);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <Field label={uiLabels.voiceSelectorLanguage} className="flex-col gap-1">
        <Select
          aria-label={uiLabels.voiceSelectorLanguage}
          className="w-full"
          value={selectedLanguage || languages[0]?.value || "English"}
          onChange={(val) => {
            if (val && onLanguageChange) {
              onLanguageChange(String(val));
            }
          }}
          options={languages}
        />
      </Field>
      <Field label={uiLabels.voiceSelectorVoice} className="flex-col gap-1">
        <Select
          aria-label={uiLabels.voiceSelectorVoice}
          className="w-full"
          value={activeVoiceValue}
          onChange={(val) => {
            if (val) {
              onVoiceChange(String(val));
            }
          }}
          options={filteredVoices}
        />
      </Field>
    </div>
  );
}
