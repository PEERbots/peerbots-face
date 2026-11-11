import type { ReactNode } from "react";
import { getFaceCapabilities, type FaceBase, type FaceCapabilities } from "./face";

export interface FaceRenderProps<TFace extends FaceBase = FaceBase> {
  face: TFace;
  isPreview?: boolean;
  frozen?: boolean;
}

export interface FaceRendererStrategy<TFace extends FaceBase = FaceBase> {
  readonly kind: string;
  readonly displayName: string;
  readonly requiresWebGL: boolean;
  getCapabilities?: (face: TFace) => FaceCapabilities;
  render: (props: FaceRenderProps<TFace>) => ReactNode;
}

export class FaceRendererRegistry {
  private readonly strategies = new Map<string, FaceRendererStrategy<FaceBase>>();

  public constructor(initialStrategies: readonly FaceRendererStrategy<FaceBase>[] = []) {
    for (const strategy of initialStrategies) {
      this.register(strategy);
    }
  }

  public register<TFace extends FaceBase>(strategy: FaceRendererStrategy<TFace>): void {
    this.strategies.set(strategy.kind, strategy as unknown as FaceRendererStrategy<FaceBase>);
  }

  public unregister(kind: string): boolean {
    return this.strategies.delete(kind);
  }

  public get(kind: string): FaceRendererStrategy<FaceBase> | undefined {
    return this.strategies.get(kind);
  }

  public has(kind: string): boolean {
    return this.strategies.has(kind);
  }

  public list(): FaceRendererStrategy<FaceBase>[] {
    return Array.from(this.strategies.values());
  }

  public getCapabilities(face?: FaceBase): FaceCapabilities {
    if (!face) {
      return getFaceCapabilities(undefined);
    }
    const strategy = this.strategies.get(face.kind);
    if (strategy?.getCapabilities) {
      return strategy.getCapabilities(face);
    }
    return getFaceCapabilities(face);
  }
}
