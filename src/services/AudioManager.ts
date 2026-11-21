/**
 * Minimal 44-byte silent PCM WAV (8kHz, 8-bit mono, 1 silent sample) encoded
 * as a data URI. Playing this inside a user gesture whitelists the persistent
 * HTMLAudioElement on Mobile Safari / iOS WebKit for subsequent async play().
 */
export const SILENT_WAV_DATA_URI =
  "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

export interface NavigatorLike {
  userAgent?: string;
  platform?: string;
  maxTouchPoints?: number;
}

/**
 * Returns true on iPhone, iPad, iPod, and iPadOS 13+ (which reports
 * `platform === "MacIntel"` with `maxTouchPoints > 1`).
 */
export function isIOSDevice(nav?: NavigatorLike): boolean {
  const target =
    nav ?? (typeof navigator !== "undefined" ? navigator : undefined);
  if (!target) {
    return false;
  }
  const ua = target.userAgent ?? "";
  if (/iPad|iPhone|iPod/.test(ua)) {
    return true;
  }
  return (
    target.platform === "MacIntel" &&
    typeof target.maxTouchPoints === "number" &&
    target.maxTouchPoints > 1
  );
}

/**
 * Returns true on Mobile Safari running on iOS / iPadOS.
 */
export function isMobileSafari(nav?: NavigatorLike): boolean {
  const target =
    nav ?? (typeof navigator !== "undefined" ? navigator : undefined);
  if (!target || !isIOSDevice(target)) {
    return false;
  }
  const ua = target.userAgent ?? "";
  return /Safari/i.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/i.test(ua);
}

interface InlineAudioElement extends HTMLAudioElement {
  playsInline?: boolean;
}

export interface AudioUnlockOptions {
  /** Optional AudioContext to resume during the user gesture. */
  audioContext?: AudioContext | null;
}

/**
 * Manages a single persistent HTMLAudioElement and centralizes mobile audio
 * unlocking (silent WAV priming, AudioContext resumption, and safe
 * speechSynthesis priming without whitespace utterances).
 */
export class AudioManager {
  private audioElement: HTMLAudioElement | null = null;
  private registeredContexts = new Set<AudioContext>();
  private unlocked = false;

  public isUnlocked(): boolean {
    return this.unlocked;
  }

  /**
   * Registers an AudioContext so `unlock()` automatically resumes it during a
   * user gesture.
   */
  public registerAudioContext(ctx: AudioContext): void {
    this.registeredContexts.add(ctx);
  }

  /**
   * Returns the single persistent HTMLAudioElement configured for inline
   * cross-origin playback on iOS / Mobile Safari.
   */
  public getAudioElement(): HTMLAudioElement | null {
    if (this.audioElement) {
      return this.audioElement;
    }
    if (typeof Audio === "undefined") {
      return null;
    }
    const audio = new Audio() as InlineAudioElement;
    audio.crossOrigin = "anonymous";
    audio.preload = "auto";
    audio.playsInline = true;
    if (typeof audio.setAttribute === "function") {
      audio.setAttribute("playsinline", "true");
    }
    this.audioElement = audio;
    return this.audioElement;
  }

  /**
   * Unlocks audio playback on iOS / Mobile Safari. MUST be called synchronously
   * inside a user-gesture event handler (e.g. click or touchstart).
   */
  public async unlock(options: AudioUnlockOptions = {}): Promise<boolean> {
    let anySucceeded = false;

    // 1. Prime persistent HTMLAudioElement synchronously inside the gesture
    const audio = this.getAudioElement();
    let audioPlayPromise: Promise<void> | null = null;
    if (audio) {
      try {
        // Only overwrite src if the element is not actively playing speech
        if (audio.paused || !audio.src) {
          audio.src = SILENT_WAV_DATA_URI;
        }
        const playResult = audio.play();
        if (playResult && typeof playResult.then === "function") {
          audioPlayPromise = playResult.then(
            () => {
              if (audio.src === SILENT_WAV_DATA_URI) {
                try {
                  audio.pause();
                  audio.currentTime = 0;
                } catch (pauseErr) {
                  void pauseErr;
                }
              }
              anySucceeded = true;
            },
            (err) => {
              console.warn("AudioManager silent WAV unlock warning:", err);
            },
          );
        } else {
          if (audio.src === SILENT_WAV_DATA_URI) {
            try {
              audio.pause();
              audio.currentTime = 0;
            } catch (pauseErr) {
              void pauseErr;
            }
          }
          anySucceeded = true;
        }
      } catch (err) {
        console.warn("AudioManager audio element unlock warning:", err);
      }
    }

    // 2. Resume any registered or provided AudioContexts
    const contextsToResume = new Set<AudioContext>(this.registeredContexts);
    if (options.audioContext) {
      contextsToResume.add(options.audioContext);
    }
    const resumePromises: Promise<void>[] = [];
    for (const ctx of contextsToResume) {
      if (ctx.state === "suspended" && typeof ctx.resume === "function") {
        resumePromises.push(
          ctx.resume().then(
            () => {
              anySucceeded = true;
            },
            (err) => {
              console.warn("AudioManager AudioContext resume warning:", err);
            },
          ),
        );
      }
    }

    // 3. Safely prime window.speechSynthesis using an empty string at volume 0
    // (NEVER whitespace " ", which hangs WebKit's speech queue on iOS Safari)
    if (
      typeof window !== "undefined" &&
      "speechSynthesis" in window &&
      typeof SpeechSynthesisUtterance !== "undefined"
    ) {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        const utterance = new SpeechSynthesisUtterance("");
        utterance.volume = 0;
        window.speechSynthesis.speak(utterance);
        anySucceeded = true;
      } catch (err) {
        console.warn("AudioManager speechSynthesis prime warning:", err);
      }
    }

    if (audioPlayPromise) {
      await audioPlayPromise;
    }
    if (resumePromises.length > 0) {
      await Promise.all(resumePromises);
    }

    if (anySucceeded) {
      this.unlocked = true;
    }
    return this.unlocked;
  }

  /**
   * Resets internal state (primarily for unit testing).
   */
  public reset(): void {
    if (this.audioElement) {
      try {
        this.audioElement.pause();
      } catch (err) {
        void err;
      }
    }
    this.audioElement = null;
    this.registeredContexts.clear();
    this.unlocked = false;
  }
}

export const audioManager = new AudioManager();
