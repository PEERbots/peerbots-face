import type { AmplitudePoint, SpeechQueueMode, TimedViseme } from "./face";

export interface FaceVoice {
  readonly name: string;
  readonly voiceURI: string;
  readonly lang: string;
  readonly default?: boolean;
  readonly localService?: boolean;
  readonly engine?: string;
}

export interface SynthesizeSpeechOptions {
  engine?: string;
  language?: string | null;
  rate?: number;
  pitch?: number;
  signal?: AbortSignal;
}

export interface SynthesizedSpeechResult {
  audioUrl?: string;
  audioBlob?: Blob;
  audioBuffer?: ArrayBuffer;
  mimeType?: string;
  visemes?: TimedViseme[];
  amplitudeData?: AmplitudePoint[];
  extrema?: AmplitudePoint[];
}

export interface SpeechSynthesizerAdapter {
  readonly id: string;
  canHandleVoice?: (voiceUri: string, voice?: FaceVoice) => boolean;
  fetchVoices?: () => Promise<FaceVoice[]>;
  synthesizeSpeech?: (
    text: string,
    voiceUri: string,
    options?: SynthesizeSpeechOptions,
  ) => Promise<SynthesizedSpeechResult>;
}

export interface ExpressOptions {
  silent?: boolean;
  queueMode?: SpeechQueueMode;
}
