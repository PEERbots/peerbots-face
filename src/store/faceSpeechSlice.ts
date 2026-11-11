import type { StateCreator } from "zustand";
import {
  DEFAULT_FACE_MESSAGE,
  type AmplitudePoint,
  type FaceMessage,
  type TimedViseme,
} from "../types/face";
import type {
  ExpressOptions,
  FaceVoice,
  SpeechSynthesizerAdapter,
} from "../types/speech";
import type { FaceRenderingSlice } from "./faceRenderingSlice";
import { findMatchingVoice, getLanguageName } from "../helpers/voice_helpers";
import { estimateVisemesFromText } from "../helpers/viseme_mapper";
import { AudioAnalyzer, audioAnalyzer as defaultAudioAnalyzer } from "../services/AudioAnalyzer";
import {
  buildTtsCacheKey,
  defaultTtsAudioCache,
  type TtsAudioCache,
} from "../services/ttsAudioCache";

export interface FaceSpeechSliceOptions {
  initialMessage?: FaceMessage;
  isSilent?: boolean;
  speechAdapter?: SpeechSynthesizerAdapter | null;
  ttsCache?: TtsAudioCache | false;
  audioAnalyzer?: AudioAnalyzer;
  utteranceDeferMs?: number;
}

export interface QueuedSpeechItem {
  message: FaceMessage;
  options?: ExpressOptions;
}

export interface FaceSpeechSlice {
  lastMessage: FaceMessage;
  isSpeaking: boolean;
  speechAllowed: boolean;
  selectedVoiceUri: string | null;
  availableVoices: FaceVoice[];
  spokenVisemes: TimedViseme[] | null;
  amplitudeData: AmplitudePoint[] | null;
  amplitudeExtrema: AmplitudePoint[] | null;
  currentAmplitude: number;
  speechStartTime: number | null;
  speechQueue: QueuedSpeechItem[];
  setSpeechAllowed: (allowed: boolean) => void;
  setAvailableVoices: (voices: FaceVoice[]) => void;
  refreshVoices: () => Promise<FaceVoice[]>;
  getSelectedVoice: () => FaceVoice;
  getDefaultVoice: () => FaceVoice;
  setVoice: (voiceUri: string, options?: { silent?: boolean }) => void;
  setSpokenVisemes: (visemes: TimedViseme[] | null) => void;
  setAmplitudeData: (
    data: AmplitudePoint[] | null,
    extrema: AmplitudePoint[] | null,
  ) => void;
  setIsSpeaking: (isSpeaking: boolean) => void;
  setCurrentAmplitude: (amplitude: number) => void;
  setSpeechAdapter: (adapter: SpeechSynthesizerAdapter | null) => void;
  express: (message: FaceMessage, options?: ExpressOptions) => Promise<void>;
  /** Alias preserved for backward compatibility with app.peerbots.org */
  _express: (message: FaceMessage, options?: ExpressOptions) => Promise<void>;
  stopSpeech: () => void;
}

const FALLBACK_DEFAULT_VOICE: FaceVoice = {
  default: false,
  lang: "en-US",
  localService: false,
  name: "en-US-Standard-B",
  voiceURI: "en-US-Standard-B",
};

function isNativeSpeechSynthesisVoice(voice: unknown): voice is SpeechSynthesisVoice {
  if (!voice || typeof voice !== "object") {
    return false;
  }
  if (
    typeof SpeechSynthesisVoice !== "undefined" &&
    voice instanceof SpeechSynthesisVoice
  ) {
    return true;
  }
  return Object.prototype.toString.call(voice) === "[object SpeechSynthesisVoice]";
}

function matchesLanguage(voiceLang: string, selectedLang: string): boolean {
  if (!voiceLang || !selectedLang) {
    return false;
  }
  return (
    getLanguageName(voiceLang) === selectedLang ||
    voiceLang === selectedLang ||
    voiceLang.toLowerCase() === selectedLang.toLowerCase() ||
    voiceLang.toLowerCase().startsWith(selectedLang.toLowerCase()) ||
    selectedLang.toLowerCase().startsWith(voiceLang.toLowerCase())
  );
}

export function stopNativeSpeechSynthesis(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
      }
    } catch (err) {
      void err;
    }
  }
}

export function createFaceSpeechSlice(
  sliceOptions: FaceSpeechSliceOptions = {},
): StateCreator<FaceRenderingSlice & FaceSpeechSlice, [], [], FaceSpeechSlice> {
  let adapter: SpeechSynthesizerAdapter | null = sliceOptions.speechAdapter ?? null;
  const cache: TtsAudioCache | null =
    sliceOptions.ttsCache === false
      ? null
      : (sliceOptions.ttsCache ?? defaultTtsAudioCache);
  const analyzer = sliceOptions.audioAnalyzer ?? defaultAudioAnalyzer;
  const utteranceDeferMs = sliceOptions.utteranceDeferMs ?? 10;

  let activeAudio: HTMLAudioElement | null = null;
  let activeObjectUrl: string | null = null;
  let activeUtterance: SpeechSynthesisUtterance | null = null;
  let activeTimer: ReturnType<typeof setTimeout> | null = null;
  let activeBoundaryTimer: ReturnType<typeof setTimeout> | null = null;
  let activeGeneration = 0;

  const revokeActiveObjectUrl = () => {
    if (activeObjectUrl) {
      try {
        URL.revokeObjectURL(activeObjectUrl);
      } catch (err) {
        void err;
      }
      activeObjectUrl = null;
    }
  };

  const cleanupActivePlayback = () => {
    activeGeneration += 1;
    if (activeTimer !== null) {
      clearTimeout(activeTimer);
      activeTimer = null;
    }
    if (activeBoundaryTimer !== null) {
      clearTimeout(activeBoundaryTimer);
      activeBoundaryTimer = null;
    }
    if (activeAudio) {
      activeAudio.onplay = null;
      activeAudio.onended = null;
      activeAudio.onerror = null;
      try {
        activeAudio.pause();
        activeAudio.currentTime = 0;
      } catch (err) {
        void err;
      }
      activeAudio = null;
    }
    revokeActiveObjectUrl();
    if (activeUtterance) {
      activeUtterance.onstart = null;
      activeUtterance.onend = null;
      activeUtterance.onerror = null;
      activeUtterance.onboundary = null;
      activeUtterance = null;
    }
    stopNativeSpeechSynthesis();
  };

  return (set, get) => {
    const playNextFromQueue = () => {
      const queue = get().speechQueue;
      if (queue.length > 0) {
        const [next, ...rest] = queue;
        set({ speechQueue: rest } as Partial<FaceRenderingSlice & FaceSpeechSlice>);
        void get().express(next.message, next.options);
      }
    };

    const finishGeneration = (gen: number) => {
      if (gen !== activeGeneration) {
        return;
      }
      if (activeBoundaryTimer !== null) {
        clearTimeout(activeBoundaryTimer);
        activeBoundaryTimer = null;
      }
      activeAudio = null;
      activeUtterance = null;
      revokeActiveObjectUrl();
      set({
        isSpeaking: false,
        speechStartTime: null,
        currentAmplitude: 0,
      } as Partial<FaceRenderingSlice & FaceSpeechSlice>);
      playNextFromQueue();
    };

    const expressImpl = async (
      message: FaceMessage,
      options?: ExpressOptions,
    ): Promise<void> => {
      const speechText = (message.speech ?? "").trim();
      const hasWords = speechText.length > 0;

      if (sliceOptions.isSilent || options?.silent || !hasWords) {
        set({
          lastMessage: message,
          isSpeaking: false,
        } as Partial<FaceRenderingSlice & FaceSpeechSlice>);
        return;
      }

      const effectiveQueueMode =
        options?.queueMode ?? get().faceSettings?.speechQueueMode ?? "interrupt";
      const currentlyPlaying =
        get().isSpeaking ||
        activeAudio !== null ||
        activeUtterance !== null ||
        activeTimer !== null;

      if (effectiveQueueMode === "queue" && currentlyPlaying) {
        set((state) => ({
          speechQueue: [...state.speechQueue, { message, options }],
        } as Partial<FaceRenderingSlice & FaceSpeechSlice>));
        return;
      }

      cleanupActivePlayback();
      const myGeneration = activeGeneration;

      set({
        lastMessage: message,
        isSpeaking: true,
      } as Partial<FaceRenderingSlice & FaceSpeechSlice>);

      const selectedVoice = get().getSelectedVoice();
      const shouldUseAdapter =
        adapter !== null &&
        typeof adapter.synthesizeSpeech === "function" &&
        (adapter.canHandleVoice
          ? adapter.canHandleVoice(selectedVoice.voiceURI, selectedVoice)
          : true);

      if (shouldUseAdapter && adapter?.synthesizeSpeech) {
        try {
          const cacheKey = buildTtsCacheKey({
            voiceId: selectedVoice.voiceURI,
            engine: selectedVoice.engine,
            text: speechText,
          });

          const cached = cache ? await cache.get(cacheKey) : undefined;
          if (myGeneration !== activeGeneration) {
            return;
          }

          let playbackUrl: string | undefined;
          let shouldRevokeUrl = false;
          let visemes: TimedViseme[] | null = null;
          let ampData: AmplitudePoint[] | null = null;
          let extrema: AmplitudePoint[] | null = null;

          if (cached && cache) {
            playbackUrl = cache.createObjectUrl(cached);
            shouldRevokeUrl = true;
            visemes = cached.visemes ?? null;
            ampData = cached.amplitudeData ?? null;
            extrema = cached.extrema ?? null;
          } else {
            const synthesized = await adapter.synthesizeSpeech(
              speechText,
              selectedVoice.voiceURI,
              {
                engine: selectedVoice.engine,
                language: get().faceSettings?.selectedLanguage,
              },
            );
            if (myGeneration !== activeGeneration) {
              return;
            }

            visemes = synthesized.visemes ?? null;
            ampData = synthesized.amplitudeData ?? null;
            extrema = synthesized.extrema ?? null;

            const mimeType = synthesized.mimeType || "audio/mpeg";
            let blobToCache: Blob | null = null;

            if (synthesized.audioBlob) {
              blobToCache = synthesized.audioBlob;
            } else if (synthesized.audioBuffer) {
              blobToCache = new Blob([synthesized.audioBuffer], { type: mimeType });
            }

            if (blobToCache) {
              if (cache) {
                await cache.set(cacheKey, {
                  audioBlob: blobToCache,
                  mimeType,
                  visemes: synthesized.visemes,
                  amplitudeData: synthesized.amplitudeData,
                  extrema: synthesized.extrema,
                });
              }
              playbackUrl = URL.createObjectURL(blobToCache);
              shouldRevokeUrl = true;
            } else if (synthesized.audioUrl) {
              playbackUrl = synthesized.audioUrl;
            }
          }

          if (playbackUrl && typeof Audio !== "undefined") {
            get().setSpokenVisemes(visemes);
            get().setAmplitudeData(ampData, extrema);

            const audio = new Audio(playbackUrl);
            audio.crossOrigin = "anonymous";
            activeAudio = audio;
            if (shouldRevokeUrl) {
              activeObjectUrl = playbackUrl;
            }
            analyzer.connect(audio);

            audio.onplay = () => {
              if (myGeneration !== activeGeneration) {
                return;
              }
              set({
                isSpeaking: true,
                speechStartTime: performance.now(),
              } as Partial<FaceRenderingSlice & FaceSpeechSlice>);

              const pollAmplitude = () => {
                if (
                  myGeneration === activeGeneration &&
                  activeAudio === audio &&
                  !audio.paused &&
                  !audio.ended
                ) {
                  get().setCurrentAmplitude(analyzer.getAmplitude());
                  if (typeof requestAnimationFrame === "function") {
                    requestAnimationFrame(pollAmplitude);
                  }
                } else if (myGeneration === activeGeneration) {
                  get().setCurrentAmplitude(0);
                }
              };
              pollAmplitude();
            };

            audio.onended = () => {
              finishGeneration(myGeneration);
            };

            audio.onerror = () => {
              finishGeneration(myGeneration);
            };

            await audio.play();
            return;
          }
        } catch (adapterError) {
          console.warn(
            "SpeechSynthesizerAdapter failed; falling back to Web Speech API:",
            adapterError,
          );
          if (myGeneration !== activeGeneration) {
            return;
          }
        }
      }

      if (
        typeof window === "undefined" ||
        typeof SpeechSynthesisUtterance === "undefined" ||
        typeof window.speechSynthesis === "undefined"
      ) {
        finishGeneration(myGeneration);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(speechText);
      activeUtterance = utterance;

      if (isNativeSpeechSynthesisVoice(selectedVoice)) {
        utterance.voice = selectedVoice;
      } else {
        const nativeVoices = window.speechSynthesis.getVoices();
        const matched =
          findMatchingVoice(nativeVoices, selectedVoice.voiceURI) ||
          findMatchingVoice(nativeVoices, selectedVoice.name);
        if (matched) {
          utterance.voice = matched;
        }
      }

      utterance.lang =
        selectedVoice.lang ||
        get().faceSettings?.selectedLanguage ||
        "en-US";

      const estimatedVisemes = estimateVisemesFromText(speechText);
      set({
        spokenVisemes: estimatedVisemes,
        amplitudeData: null,
        amplitudeExtrema: null,
        currentAmplitude: 0,
      } as Partial<FaceRenderingSlice & FaceSpeechSlice>);

      utterance.onstart = () => {
        if (myGeneration !== activeGeneration) {
          return;
        }
        set({
          isSpeaking: true,
          speechStartTime: performance.now(),
        } as Partial<FaceRenderingSlice & FaceSpeechSlice>);
      };

      utterance.onboundary = (event: SpeechSynthesisEvent) => {
        if (myGeneration !== activeGeneration) {
          return;
        }
        if (event.name === "word") {
          get().setCurrentAmplitude(1.0);
          if (activeBoundaryTimer !== null) {
            clearTimeout(activeBoundaryTimer);
          }
          activeBoundaryTimer = setTimeout(() => {
            if (myGeneration === activeGeneration) {
              get().setCurrentAmplitude(0);
            }
          }, 100);
        }
      };

      utterance.onend = () => {
        finishGeneration(myGeneration);
      };

      utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
        if (event.error === "not-allowed") {
          get().setSpeechAllowed(false);
        }
        finishGeneration(myGeneration);
      };

      const invokeSpeak = () => {
        activeTimer = null;
        if (myGeneration !== activeGeneration) {
          return;
        }
        try {
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
          window.speechSynthesis.speak(utterance);
        } catch (speakErr) {
          console.warn("SpeechSynthesis speak invocation error:", speakErr);
          finishGeneration(myGeneration);
        }
      };

      if (utteranceDeferMs <= 0) {
        invokeSpeak();
      } else {
        activeTimer = setTimeout(invokeSpeak, utteranceDeferMs);
      }
    };

    return {
      lastMessage: sliceOptions.initialMessage ?? DEFAULT_FACE_MESSAGE,
      isSpeaking: false,
      speechAllowed: false,
      selectedVoiceUri: null,
      availableVoices: [],
      spokenVisemes: null,
      amplitudeData: null,
      amplitudeExtrema: null,
      currentAmplitude: 0,
      speechStartTime: null,
      speechQueue: [],

      setSpeechAllowed: (allowed) => {
        set({ speechAllowed: allowed } as Partial<FaceRenderingSlice & FaceSpeechSlice>);
      },

      setAvailableVoices: (voices) => {
        set({ availableVoices: voices } as Partial<FaceRenderingSlice & FaceSpeechSlice>);
      },

      refreshVoices: async () => {
        const collected: FaceVoice[] = [];
        const seen = new Set<string>();

        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          const browserVoices = window.speechSynthesis.getVoices();
          for (const v of browserVoices) {
            if (!seen.has(v.voiceURI)) {
              seen.add(v.voiceURI);
              collected.push(v);
            }
          }
        }

        if (adapter?.fetchVoices) {
          try {
            const remoteVoices = await adapter.fetchVoices();
            for (const v of remoteVoices) {
              if (!seen.has(v.voiceURI)) {
                seen.add(v.voiceURI);
                collected.push(v);
              }
            }
          } catch (err) {
            console.warn("Failed to fetch adapter voices:", err);
          }
        }

        set({ availableVoices: collected } as Partial<FaceRenderingSlice & FaceSpeechSlice>);
        return collected;
      },

      getDefaultVoice: () => {
        const voices = get().availableVoices;
        const selectedLang = get().faceSettings?.selectedLanguage;
        if (selectedLang) {
          const langVoice = voices.find((v) =>
            matchesLanguage(v.lang, selectedLang),
          );
          if (langVoice) {
            return langVoice;
          }
        }
        const defaultFlagged = voices.find((v) => v.default === true);
        if (defaultFlagged) {
          return defaultFlagged;
        }
        if (voices.length > 0) {
          return voices[0];
        }
        return {
          ...FALLBACK_DEFAULT_VOICE,
          lang: selectedLang || "en-US",
        };
      },

      getSelectedVoice: () => {
        const uri = get().selectedVoiceUri;
        const voices = get().availableVoices;
        if (uri !== null) {
          const matched = findMatchingVoice(voices, uri);
          if (matched) {
            return matched;
          }
        }
        return get().getDefaultVoice();
      },

      setVoice: (voiceUri, voiceOptions) => {
        const prevVoice =
          get().selectedVoiceUri || get().getSelectedVoice()?.voiceURI;
        set({ selectedVoiceUri: voiceUri } as Partial<FaceRenderingSlice & FaceSpeechSlice>);

        if (
          !sliceOptions.isSilent &&
          !voiceOptions?.silent &&
          prevVoice &&
          prevVoice !== voiceUri
        ) {
          void get().express({
            title: "Switching voice",
            speech: "Switching voice",
            color: "Light Blue",
            emotion: "Neutral",
          });
        }
      },

      setSpokenVisemes: (visemes) => {
        set({ spokenVisemes: visemes } as Partial<FaceRenderingSlice & FaceSpeechSlice>);
      },

      setAmplitudeData: (data, extrema) => {
        set({
          amplitudeData: data,
          amplitudeExtrema: extrema,
        } as Partial<FaceRenderingSlice & FaceSpeechSlice>);
      },

      setIsSpeaking: (isSpeaking) => {
        set({ isSpeaking } as Partial<FaceRenderingSlice & FaceSpeechSlice>);
      },

      setCurrentAmplitude: (amplitude) => {
        const gain = get().faceSettings?.amplitudeGain ?? 1;
        const scaled = amplitude * gain;
        const clamped = Number.isNaN(scaled)
          ? 0
          : Math.min(1, Math.max(0, scaled));
        set({ currentAmplitude: clamped } as Partial<FaceRenderingSlice & FaceSpeechSlice>);
      },

      setSpeechAdapter: (nextAdapter) => {
        adapter = nextAdapter;
      },

      express: expressImpl,
      _express: expressImpl,

      stopSpeech: () => {
        cleanupActivePlayback();
        set({
          isSpeaking: false,
          speechStartTime: null,
          currentAmplitude: 0,
          spokenVisemes: null,
          amplitudeData: null,
          amplitudeExtrema: null,
          speechQueue: [],
        } as Partial<FaceRenderingSlice & FaceSpeechSlice>);
      },
    };
  };
}
