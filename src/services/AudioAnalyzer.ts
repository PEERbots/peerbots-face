export class AudioAnalyzer {
  private ctx: AudioContext | null = null;
  private analyzer: AnalyserNode | null = null;
  private data: Uint8Array<ArrayBuffer> | null = null;
  private readonly connectedElements = new WeakSet<HTMLAudioElement>();

  public connect(audio: HTMLAudioElement): void {
    if (typeof window === "undefined") {
      return;
    }
    const AudioContextCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextCtor) {
      return;
    }

    try {
      if (!this.ctx) {
        this.ctx = new AudioContextCtor();
        this.analyzer = this.ctx.createAnalyser();
        this.analyzer.fftSize = 256;
        this.data = new Uint8Array(new ArrayBuffer(this.analyzer.frequencyBinCount));
      }
      if (!this.connectedElements.has(audio) && this.analyzer) {
        const source = this.ctx.createMediaElementSource(audio);
        source.connect(this.analyzer);
        this.analyzer.connect(this.ctx.destination);
        this.connectedElements.add(audio);
      }
    } catch (error) {
      console.warn("AudioAnalyzer connect error:", error);
    }
  }

  public getAmplitude(): number {
    if (!this.analyzer || !this.data) {
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
