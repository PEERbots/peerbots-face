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
});
