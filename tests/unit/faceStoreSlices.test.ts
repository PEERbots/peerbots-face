import { afterEach, describe, expect, it, vi } from "vitest";
import {
  TtsAudioCache,
  createPeerbotsFaceStore,
  type FaceMessage,
  type SpeechSynthesizerAdapter,
} from "../../src";

describe("PeerbotsFaceStore (rendering + speech slices)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("manages face selection, nested settings merges, gaze clamping, and assetBaseUrl updates", () => {
    const store = createPeerbotsFaceStore({ isSilent: true });
    expect(store.getState().selectedFace.name).toBe("Hugo");

    store.getState().setFaceByName("Robotic");
    expect(store.getState().selectedFace.name).toBe("Robotic");

    store.getState().setFaceSettings({
      zoom: 1.5,
      offset: { x: 120, y: -40 },
      rotation: 90,
      captions: { enabled: true, fontSize: 40, offset: { x: 10, y: 5 } },
    });
    expect(store.getState().faceSettings.zoom).toBe(1.5);
    expect(store.getState().faceSettings.captions.enabled).toBe(true);
    expect(store.getState().faceSettings.pixiSettings?.eyeDisplay).toBe("default");

    store.getState().resetPositioning();
    expect(store.getState().faceSettings.zoom).toBe(1);
    expect(store.getState().faceSettings.offset).toEqual({ x: 0, y: 0 });
    expect(store.getState().faceSettings.rotation).toBe(0);
    // Captions remain intact after resetPositioning
    expect(store.getState().faceSettings.captions.enabled).toBe(true);

    store.getState().setGaze({ x: 2.5, y: -3 });
    expect(store.getState().gaze).toEqual({ x: 1, y: -1 });
    store.getState().setGaze({ x: Number.NaN, y: 0.4 });
    expect(store.getState().gaze).toEqual({ x: 0, y: 0.4 });

    store.getState().setLanguage("Spanish");
    expect(store.getState().faceSettings.selectedLanguage).toBe("Spanish");

    store.getState().setAssetBaseUrl("/custom-assets/");
    expect(store.getState().assetBaseUrl).toBe("/custom-assets");
    const robotic = store.getState().selectedFace;
    if (robotic.kind === "PixiFace" && robotic.type === "avatar") {
      expect(robotic.eyes.path).toBe(
        "/custom-assets/Robotic/robotic_spritesheet.json",
      );
    }
  });

  it("synthesizes via SpeechSynthesizerAdapter, caches audio in TtsAudioCache, and supports queue vs interrupt modes", async () => {
    const audioInstances: Array<{
      src: string;
      paused: boolean;
      ended: boolean;
      onplay: (() => void) | null;
      onended: (() => void) | null;
      onerror: (() => void) | null;
      play: () => Promise<void>;
      pause: () => void;
    }> = [];

    class FakeAudio {
      public src: string;
      public crossOrigin: string | null = null;
      public currentTime = 0;
      public paused = true;
      public ended = false;
      public onplay: (() => void) | null = null;
      public onended: (() => void) | null = null;
      public onerror: (() => void) | null = null;

      public constructor(src: string) {
        this.src = src;
        audioInstances.push(this);
      }

      public async play(): Promise<void> {
        this.paused = false;
        this.onplay?.();
      }

      public pause(): void {
        this.paused = true;
      }
    }

    vi.stubGlobal("Audio", FakeAudio);

    const synthesizeSpy = vi.fn(async (text: string) => ({
      audioBlob: new Blob([`mp3:${text}`], { type: "audio/mpeg" }),
      mimeType: "audio/mpeg",
      visemes: [{ time: 0.12, type: "viseme", value: "a" }],
      amplitudeData: [{ time: 0, value: 0.8 }],
      extrema: [{ time: 0, value: 0.8 }],
    }));

    const adapter: SpeechSynthesizerAdapter = {
      id: "polly-test",
      canHandleVoice: (uri) => uri.startsWith("aws:"),
      fetchVoices: async () => [
        {
          name: "AWS - Joanna",
          voiceURI: "aws:Joanna:neural",
          lang: "en-US",
          engine: "neural",
        },
      ],
      synthesizeSpeech: synthesizeSpy,
    };

    const cache = new TtsAudioCache({ maxEntries: 10, enableIndexedDb: false });
    const store = createPeerbotsFaceStore({
      speechAdapter: adapter,
      ttsCache: cache,
    });

    const voices = await store.getState().refreshVoices();
    expect(voices).toHaveLength(1);
    store.getState().setVoice("aws:Joanna:neural", { silent: true });

    const msg1: FaceMessage = {
      title: "Hello",
      speech: "Hello there",
      color: "Green",
      emotion: "Happy",
    };

    await store.getState().express(msg1);
    expect(synthesizeSpy).toHaveBeenCalledTimes(1);
    expect(store.getState().isSpeaking).toBe(true);
    expect(store.getState().spokenVisemes).toEqual([
      { time: 0.12, type: "viseme", value: "a" },
    ]);
    expect(audioInstances).toHaveLength(1);

    // Finish first playback
    audioInstances[0].ended = true;
    audioInstances[0].onended?.();
    expect(store.getState().isSpeaking).toBe(false);

    // Repeating same phrase hits TtsAudioCache without calling synthesizeSpeech again
    await store.getState().express(msg1);
    expect(synthesizeSpy).toHaveBeenCalledTimes(1);
    expect(audioInstances).toHaveLength(2);

    // Test QUEUE mode: arriving messages wait in FIFO order
    store.getState().setFaceSettings({ speechQueueMode: "queue" });
    const msg2: FaceMessage = {
      title: "Second",
      speech: "Second phrase",
      color: "Yellow",
      emotion: "Surprised",
    };
    const msg3: FaceMessage = {
      title: "Third",
      speech: "Third phrase",
      color: "Pink",
      emotion: "Concerned",
    };

    await store.getState().express(msg2);
    await store.getState().express(msg3);
    expect(store.getState().speechQueue).toHaveLength(2);
    expect(store.getState().lastMessage.title).toBe("Hello");

    // Completing active audio automatically dequeues msg2
    audioInstances[1].ended = true;
    audioInstances[1].onended?.();
    await vi.waitFor(() => {
      expect(store.getState().lastMessage.title).toBe("Second");
      expect(audioInstances).toHaveLength(3);
    });

    // Interrupt via stopSpeech clears remaining queue
    store.getState().stopSpeech();
    expect(store.getState().isSpeaking).toBe(false);
    expect(store.getState().speechQueue).toHaveLength(0);
  });

  it("falls back to browser SpeechSynthesis when adapter is absent or fails", async () => {
    const utterances: Array<{
      text: string;
      lang: string;
      onstart: (() => void) | null;
      onboundary: ((e: { name: string }) => void) | null;
      onend: (() => void) | null;
      onerror: ((e: { error: string }) => void) | null;
    }> = [];

    class FakeUtterance {
      public text: string;
      public lang = "";
      public voice: unknown = null;
      public onstart: (() => void) | null = null;
      public onboundary: ((e: { name: string }) => void) | null = null;
      public onend: (() => void) | null = null;
      public onerror: ((e: { error: string }) => void) | null = null;

      public constructor(text: string) {
        this.text = text;
        utterances.push(this);
      }
    }

    const speakSpy = vi.fn((u: FakeUtterance) => {
      u.onstart?.();
    });
    const cancelSpy = vi.fn();

    vi.stubGlobal("SpeechSynthesisUtterance", FakeUtterance);
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        speaking: false,
        pending: false,
        paused: false,
        getVoices: () => [
          {
            name: "Samantha",
            voiceURI: "urn:samantha",
            lang: "en-US",
            default: true,
            localService: true,
          },
        ],
        speak: speakSpy,
        cancel: cancelSpy,
        resume: vi.fn(),
      },
    });

    const failingAdapter: SpeechSynthesizerAdapter = {
      id: "failing",
      synthesizeSpeech: async () => {
        throw new Error("Offline");
      },
    };

    const store = createPeerbotsFaceStore({
      speechAdapter: failingAdapter,
      utteranceDeferMs: 0,
    });
    store.getState().setSpeechAllowed(true);
    await store.getState().refreshVoices();

    await store.getState().express({
      title: "Fallback",
      speech: "Testing native speech",
      color: "Blue",
      emotion: "Neutral",
    });

    expect(speakSpy).toHaveBeenCalledTimes(1);
    expect(utterances).toHaveLength(1);
    expect(store.getState().isSpeaking).toBe(true);

    // Word boundary pulses amplitude
    utterances[0].onboundary?.({ name: "word" });
    expect(store.getState().currentAmplitude).toBe(1);

    // Simulated not-allowed error flips speechAllowed to false
    utterances[0].onerror?.({ error: "not-allowed" });
    expect(store.getState().speechAllowed).toBe(false);
    expect(store.getState().isSpeaking).toBe(false);
  });

  it("hydrates persisted store settings and Vizij custom face safely", () => {
    localStorage.setItem(
      "test-face-persist",
      JSON.stringify({
        state: {
          selectedFace: {
            kind: "Vizij",
            name: "Custom Face",
            assetBundle: {
              namespace: "custom",
              glb: { kind: "url", src: "blob:custom-rig", aggressiveImport: true },
            },
          },
          faceSettings: { zoom: 1.8 },
          selectedVoiceUri: "aws:Joanna:neural",
        },
        version: 1,
      }),
    );

    const hydratedStore = createPeerbotsFaceStore({
      persistName: "test-face-persist",
      isSilent: true,
    });

    expect(hydratedStore.getState().selectedFace.name).toBe("Custom Face");
    expect(hydratedStore.getState().faceSettings.zoom).toBe(1.8);
    expect(hydratedStore.getState().selectedVoiceUri).toBe("aws:Joanna:neural");
  });
});
