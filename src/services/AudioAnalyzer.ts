import { audioManager, isIOSDevice } from "./AudioManager";

export interface AudioAnalyzerConnectOptions {
  /** Override the iOS Safari bypass (primarily for testing). */
  force?: boolean;
}

export class AudioAnalyzer {
  private ctx: AudioContext | null = null;
  private analyzer: AnalyserNode | null = null;
  private data: Uint8Array<ArrayBuffer> | null = null;
  private readonly connectedElements = new WeakSet<HTMLAudioElement>();

  public getContext(): AudioContext | null {
    return this.ctx;
  }

  public async resumeContext(): Promise<boolean> {
    if (!this.ctx) {
      return false;
    }
    if (this.ctx.state === "suspended" && typeof this.ctx.resume === "function") {
      try {
        await this.ctx.resume();
      } catch (error) {
        console.warn("AudioAnalyzer resumeContext error:", error);
        return false;
      }
    }
    return this.ctx.state !== "suspended";
  }

  public connect(
    audio: HTMLAudioElement,
    options: AudioAnalyzerConnectOptions = {},
  ): boolean {
    if (typeof window === "undefined") {
      return false;
    }

    // On iOS / Mobile Safari, attaching createMediaElementSource to an <audio>
    // element can route playback through a throttled/suspended WebKit
    // AudioContext into silence. Skip Web Audio attachment so audio plays
    // directly through native device speakers.
    if (!options.force && isIOSDevice()) {
      return false;
    }

    const AudioContextCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextCtor) {
      return false;
    }

    try {
      if (!this.ctx) {
        this.ctx = new AudioContextCtor();
        audioManager.registerAudioContext(this.ctx);
      }

      // If the AudioContext is suspended, do not hijack the <audio> element
      // into a suspended graph. Attempt to resume for future playback.
      if (this.ctx.state === "suspended") {
        if (typeof this.ctx.resume === "function") {
          void this.ctx.resume().catch((err) => {
            console.warn("AudioAnalyzer AudioContext resume warning:", err);
          });
        }
        return false;
      }

      if (!this.analyzer) {
        this.analyzer = this.ctx.createAnalyser();
        this.analyzer.fftSize = 256;
        this.data = new Uint8Array(
          new ArrayBuffer(this.analyzer.frequencyBinCount),
        );
      }

      if (!this.connectedElements.has(audio) && this.analyzer) {
        const source = this.ctx.createMediaElementSource(audio);
        source.connect(this.analyzer);
        this.analyzer.connect(this.ctx.destination);
        this.connectedElements.add(audio);
      }
      return true;
    } catch (error) {
      console.warn("AudioAnalyzer connect error:", error);
      return false;
    }
  }

  public getAmplitude(): number {
    if (!this.analyzer || !this.data || this.ctx?.state === "suspended") {
      return 0;
    }
    this.analyzer.getByteTimeDomainData(this.data);
    let sum = 0;
    for (const v of this.data) {
      const normalized = (v - 128) / 128;
      sum += normalized * normalized;
    }
    return Math.sqrt(sum / this.data.length);
  }
}

export const audioAnalyzer = new AudioAnalyzer();
