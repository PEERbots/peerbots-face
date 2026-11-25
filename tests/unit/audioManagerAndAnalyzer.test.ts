import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AudioAnalyzer,
  AudioManager,
  SILENT_WAV_DATA_URI,
  createPeerbotsFaceStore,
  isIOSDevice,
  isMobileSafari,
  type SpeechSynthesizerAdapter,
} from "../../src";

describe("iOS / Mobile Safari device detection", () => {
  it("detects iPhone, iPad, iPadOS desktop-mode, and distinguishes Mobile Safari from Chrome on iOS", () => {
    const iphoneSafari = {
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      platform: "iPhone",
      maxTouchPoints: 5,
    };
    expect(isIOSDevice(iphoneSafari)).toBe(true);
    expect(isMobileSafari(iphoneSafari)).toBe(true);

    const ipadDesktopMode = {
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
      platform: "MacIntel",
      maxTouchPoints: 5,
    };
    expect(isIOSDevice(ipadDesktopMode)).toBe(true);
    expect(isMobileSafari(ipadDesktopMode)).toBe(true);

    const iphoneChrome = {
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/119.0.0.0 Mobile/15E148 Safari/604.1",
      platform: "iPhone",
      maxTouchPoints: 5,
    };
    expect(isIOSDevice(iphoneChrome)).toBe(true);
    expect(isMobileSafari(iphoneChrome)).toBe(false);

    const desktopMac = {
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      platform: "MacIntel",
      maxTouchPoints: 0,
    };
    expect(isIOSDevice(desktopMac)).toBe(false);
    expect(isMobileSafari(desktopMac)).toBe(false);
  });
});

describe("AudioManager", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("reuses a single persistent HTMLAudioElement and unlocks with silent WAV, AudioContext resume, and empty-string speechSynthesis priming", async () => {
    const playSpy = vi.fn().mockResolvedValue(undefined);
    const pauseSpy = vi.fn();
    const setAttributeSpy = vi.fn();

    class FakeAudio {
      public src = "";
      public crossOrigin: string | null = null;
      public preload = "";
      public playsInline = false;
      public paused = true;
      public currentTime = 0;
      public setAttribute = setAttributeSpy;
      public play = playSpy;
      public pause = pauseSpy;
    }

    const spokenUtterances: Array<{ text: string; volume: number }> = [];
    class FakeUtterance {
      public text: string;
      public volume = 1;
      constructor(text: string) {
        this.text = text;
      }
    }

    const speakSpy = vi.fn((u: FakeUtterance) => {
      spokenUtterances.push({ text: u.text, volume: u.volume });
    });

    vi.stubGlobal("Audio", FakeAudio);
    vi.stubGlobal("SpeechSynthesisUtterance", FakeUtterance);
    vi.stubGlobal("speechSynthesis", {
      paused: false,
      speaking: false,
      pending: false,
      speak: speakSpy,
      resume: vi.fn(),
      cancel: vi.fn(),
      getVoices: () => [],
    });

    const manager = new AudioManager();
    const first = manager.getAudioElement();
    const second = manager.getAudioElement();
    expect(first).not.toBeNull();
    expect(first).toBe(second);
    expect(first?.crossOrigin).toBe("anonymous");
    expect(setAttributeSpy).toHaveBeenCalledWith("playsinline", "true");

    const resumeSpy = vi.fn().mockResolvedValue(undefined);
    const fakeCtx = {
      state: "suspended",
      resume: resumeSpy,
    } as unknown as AudioContext;

    expect(manager.isUnlocked()).toBe(false);
    const result = await manager.unlock({ audioContext: fakeCtx });
    expect(result).toBe(true);
    expect(manager.isUnlocked()).toBe(true);

    expect(first?.src).toBe(SILENT_WAV_DATA_URI);
    expect(playSpy).toHaveBeenCalledTimes(1);
    expect(pauseSpy).toHaveBeenCalledTimes(1);
    expect(resumeSpy).toHaveBeenCalledTimes(1);

    // Must prime with empty string at volume 0 — NEVER whitespace " "
    expect(spokenUtterances).toEqual([{ text: "", volume: 0 }]);

    manager.reset();
    expect(manager.isUnlocked()).toBe(false);
  });

  it("uses a genuine 16-bit signed PCM all-zero silent WAV (zero DC offset)", () => {
    expect(SILENT_WAV_DATA_URI.startsWith("data:audio/wav;base64,")).toBe(true);
    const b64 = SILENT_WAV_DATA_URI.slice("data:audio/wav;base64,".length);
    const bytes = Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0));
    const view = new DataView(bytes.buffer);

    const ascii = (start: number, len: number) =>
      String.fromCharCode(...bytes.slice(start, start + len));

    expect(ascii(0, 4)).toBe("RIFF");
    expect(ascii(8, 4)).toBe("WAVE");
    expect(ascii(12, 4)).toBe("fmt ");
    expect(view.getUint16(20, true)).toBe(1); // PCM
    expect(view.getUint16(22, true)).toBe(1); // Mono
    expect(view.getUint16(34, true)).toBe(16); // 16-bit signed PCM
    expect(ascii(36, 4)).toBe("data");

    const dataSize = view.getUint32(40, true);
    expect(dataSize).toBeGreaterThanOrEqual(2);
    for (let offset = 44; offset < 44 + dataSize; offset += 2) {
      expect(view.getInt16(offset, true)).toBe(0);
    }
  });

  it("mutes the audio element during silent unlock priming and restores muted state afterward", async () => {
    const mutedDuringPlay: boolean[] = [];
    let shouldReject = false;

    class FakeAudio {
      public src = "";
      public crossOrigin: string | null = null;
      public preload = "";
      public playsInline = false;
      public paused = true;
      public muted = false;
      public currentTime = 0;
      public setAttribute = vi.fn();
      public pause = vi.fn();
      public play = vi.fn(() => {
        mutedDuringPlay.push(this.muted);
        return shouldReject
          ? Promise.reject(new Error("blocked"))
          : Promise.resolve();
      });
    }

    vi.stubGlobal("Audio", FakeAudio);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const manager = new AudioManager();
    const audio = manager.getAudioElement()!;
    audio.muted = false;

    await manager.unlock();
    expect(mutedDuringPlay).toEqual([true]);
    expect(audio.muted).toBe(false);

    // Also restores muted state if play() rejects
    shouldReject = true;
    audio.muted = false;
    await manager.unlock();
    expect(mutedDuringPlay).toEqual([true, true]);
    expect(audio.muted).toBe(false);
    expect(warnSpy).toHaveBeenCalled();
  });
});

describe("AudioAnalyzer iOS and suspended AudioContext guards", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("skips createMediaElementSource on iOS devices", () => {
    const createSourceSpy = vi.fn();
    class FakeAudioContext {
      public state: AudioContextState = "running";
      public destination = {};
      public createAnalyser = vi.fn();
      public createMediaElementSource = createSourceSpy;
    }

    vi.stubGlobal("AudioContext", FakeAudioContext);
    vi.spyOn(window.navigator, "userAgent", "get").mockReturnValue(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1",
    );

    const analyzer = new AudioAnalyzer();
    const audio = document.createElement("audio");
    const connected = analyzer.connect(audio);

    expect(connected).toBe(false);
    expect(createSourceSpy).not.toHaveBeenCalled();
  });

  it("skips createMediaElementSource when AudioContext is suspended and supports resumeContext()", async () => {
    const createSourceSpy = vi.fn();
    const resumeSpy = vi.fn(function (this: { state: AudioContextState }) {
      this.state = "running";
      return Promise.resolve();
    });

    class SuspendedAudioContext {
      public state: AudioContextState = "suspended";
      public destination = {};
      public resume = resumeSpy;
      public createAnalyser = vi.fn();
      public createMediaElementSource = createSourceSpy;
    }

    vi.stubGlobal("AudioContext", SuspendedAudioContext);

    const analyzer = new AudioAnalyzer();
    const audio = document.createElement("audio");
    const connected = analyzer.connect(audio);

    expect(connected).toBe(false);
    expect(createSourceSpy).not.toHaveBeenCalled();
    expect(analyzer.getAmplitude()).toBe(0);

    const resumed = await analyzer.resumeContext();
    expect(resumed).toBe(true);
    expect(resumeSpy).toHaveBeenCalled();
  });
});

describe("faceSpeechSlice persistent audio reuse and NotAllowedError recovery", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("reuses AudioManager singleton element across utterances and resets speechAllowed on NotAllowedError without Web Speech fallback", async () => {
    const createdAudioInstances: FakeAudio[] = [];
    let shouldRejectNotAllowed = false;

    class FakeAudio {
      public src = "";
      public crossOrigin: string | null = null;
      public preload = "";
      public playsInline = false;
      public paused = true;
      public ended = false;
      public currentTime = 0;
      public onplay: (() => void) | null = null;
      public onended: (() => void) | null = null;
      public onerror: (() => void) | null = null;
      constructor() {
        createdAudioInstances.push(this);
      }
      public setAttribute = vi.fn();
      public pause = vi.fn(() => {
        this.paused = true;
      });
      public play = vi.fn(async () => {
        if (shouldRejectNotAllowed) {
          const err = new Error("Autoplay prevented");
          err.name = "NotAllowedError";
          throw err;
        }
        this.paused = false;
        this.onplay?.();
        this.onended?.();
      });
    }

    const speakSpy = vi.fn();
    class FakeUtterance {
      public text: string;
      public volume = 1;
      constructor(text: string) {
        this.text = text;
      }
    }

    vi.stubGlobal("Audio", FakeAudio);
    vi.stubGlobal("SpeechSynthesisUtterance", FakeUtterance);
    vi.stubGlobal("speechSynthesis", {
      paused: false,
      speaking: false,
      pending: false,
      speak: speakSpy,
      resume: vi.fn(),
      cancel: vi.fn(),
      getVoices: () => [],
    });

    const adapter: SpeechSynthesizerAdapter = {
      id: "test-adapter",
      synthesizeSpeech: vi.fn(async (text: string) => ({
        audioUrl: `https://example.test/tts/${encodeURIComponent(text)}.mp3`,
        mimeType: "audio/mpeg",
      })),
    };

    const manager = new AudioManager();
    const store = createPeerbotsFaceStore({
      speechAdapter: adapter,
      ttsCache: false,
      audioManager: manager,
      utteranceDeferMs: 0,
    });

    // Unlock audio first
    await store.getState().unlockAudio();
    expect(store.getState().speechAllowed).toBe(true);
    expect(createdAudioInstances).toHaveLength(1);
    // Unlock should have primed with empty string, never whitespace
    expect(speakSpy).toHaveBeenCalledTimes(1);
    expect((speakSpy.mock.calls[0][0] as FakeUtterance).text).toBe("");
    speakSpy.mockClear();

    // Express two messages — both must reuse the single persistent Audio instance
    await store.getState().express({
      title: "One",
      speech: "First line",
      color: "Light Blue",
      emotion: "Happy",
    });
    await store.getState().express({
      title: "Two",
      speech: "Second line",
      color: "Light Blue",
      emotion: "Happy",
    });
    expect(createdAudioInstances).toHaveLength(1);
    expect(createdAudioInstances[0].src).toContain("Second%20line");
    expect(speakSpy).not.toHaveBeenCalled();

    // Now simulate Safari autoplay block (NotAllowedError)
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    shouldRejectNotAllowed = true;

    await store.getState().express({
      title: "Blocked",
      speech: "Blocked line",
      color: "Light Blue",
      emotion: "Neutral",
    });

    expect(warnSpy).toHaveBeenCalled();
    expect(store.getState().speechAllowed).toBe(false);
    expect(store.getState().isSpeaking).toBe(false);
    // Must NOT fall through to Web Speech API on NotAllowedError
    expect(speakSpy).not.toHaveBeenCalled();
  });

  it("defers URL.revokeObjectURL after onended instead of revoking synchronously", async () => {
    vi.useFakeTimers();
    try {
      const audioInstances: FakeAudio[] = [];

      class FakeAudio {
        public src = "";
        public crossOrigin: string | null = null;
        public preload = "";
        public playsInline = false;
        public paused = true;
        public ended = false;
        public muted = false;
        public currentTime = 0;
        public onplay: (() => void) | null = null;
        public onended: (() => void) | null = null;
        public onerror: (() => void) | null = null;
        constructor() {
          audioInstances.push(this);
        }
        public setAttribute = vi.fn();
        public pause = vi.fn(() => {
          this.paused = true;
        });
        public play = vi.fn(async () => {
          this.paused = false;
          this.onplay?.();
        });
      }

      vi.stubGlobal("Audio", FakeAudio);
      const createUrlSpy = vi
        .spyOn(URL, "createObjectURL")
        .mockReturnValue("blob:peerbots-test-voice-switch");
      const revokeUrlSpy = vi
        .spyOn(URL, "revokeObjectURL")
        .mockImplementation(() => {});

      const adapter: SpeechSynthesizerAdapter = {
        id: "blob-adapter",
        synthesizeSpeech: vi.fn(async () => ({
          audioBlob: new Blob(["fake-audio"], { type: "audio/mpeg" }),
          mimeType: "audio/mpeg",
        })),
      };

      const store = createPeerbotsFaceStore({
        speechAdapter: adapter,
        ttsCache: false,
        audioManager: new AudioManager(),
        utteranceDeferMs: 0,
      });

      await store.getState().express({
        title: "Switching voice",
        speech: "Switching voice",
        color: "Light Blue",
        emotion: "Neutral",
      });

      expect(createUrlSpy).toHaveBeenCalledTimes(1);
      expect(audioInstances).toHaveLength(1);

      // Trigger onended — URL must NOT be revoked synchronously
      audioInstances[0].ended = true;
      audioInstances[0].onended?.();
      expect(store.getState().isSpeaking).toBe(false);
      expect(revokeUrlSpy).not.toHaveBeenCalled();

      // After the ~100ms deferral window, the blob URL is revoked cleanly
      vi.advanceTimersByTime(100);
      expect(revokeUrlSpy).toHaveBeenCalledWith(
        "blob:peerbots-test-voice-switch",
      );
    } finally {
      vi.useRealTimers();
    }
  });
});
