import { lazy, Suspense } from "react";
import { cn } from "@peerbots/core";
import { useFaceStore } from "../store/FaceStoreContext";
import { getFaceCapabilities, type PixiFace, type VizijFace } from "../types/face";
import {
  FaceRendererRegistry,
  type FaceRendererStrategy,
} from "../types/renderer";
import { resolveFaceUiLabels, type FaceUiLabels } from "../types/labels";
import { isHeadlessOrTestEnvironment } from "../helpers/environment";
import { FaceCaption } from "./FaceCaption";
import { FaceViewSkeleton } from "./FaceViewSkeleton";
import { StaticFaceFallback } from "./StaticFaceFallback";

const LazyPixiFaceView = lazy(() =>
  import("./PixiFaceView").then((module) => ({
    default: module.PixiFaceView,
  })),
);

const LazyVizijFaceView = lazy(() =>
  import("./VizijFaceView").then((module) => ({
    default: module.VizijFaceView,
  })),
);

export const pixiFaceRendererStrategy: FaceRendererStrategy<PixiFace> = {
  kind: "PixiFace",
  displayName: "PixiJS 2D Face Renderer",
  requiresWebGL: true,
  getCapabilities: (face) => getFaceCapabilities(face),
  render: ({ isPreview, frozen }) => (
    <LazyPixiFaceView isPreview={isPreview} frozen={frozen} />
  ),
};

export const vizijFaceRendererStrategy: FaceRendererStrategy<VizijFace> = {
  kind: "Vizij",
  displayName: "Vizij 3D WebAssembly Face Renderer",
  requiresWebGL: true,
  getCapabilities: (face) => getFaceCapabilities(face),
  render: () => <LazyVizijFaceView />,
};

export function createDefaultFaceRendererRegistry(): FaceRendererRegistry {
  const registry = new FaceRendererRegistry();
  registry.register(pixiFaceRendererStrategy);
  registry.register(vizijFaceRendererStrategy);
  return registry;
}

export const defaultFaceRendererRegistry = createDefaultFaceRendererRegistry();

export interface FaceViewProps {
  isPreview?: boolean;
  frozen?: boolean;
  /**
   * Controls whether WebGL engines or the accessible StaticFaceFallback render:
   * - "auto" (default): uses WebGL engines in interactive browsers and StaticFaceFallback in headless tests or when WebGL is unavailable.
   * - "static": always renders StaticFaceFallback.
   * - "live": forces the registered strategy renderer.
   */
  renderMode?: "auto" | "static" | "live";
  showStaticSprites?: boolean;
  registry?: FaceRendererRegistry;
  labels?: Partial<FaceUiLabels>;
  className?: string;
}

export function FaceView({
  isPreview = false,
  frozen = false,
  renderMode = "auto",
  showStaticSprites = true,
  registry = defaultFaceRendererRegistry,
  labels,
  className,
}: FaceViewProps = {}) {
  const uiLabels = resolveFaceUiLabels(labels);
  const selectedFace = useFaceStore((state) => state.selectedFace);
  const strategy = selectedFace ? registry.get(selectedFace.kind) : undefined;

  const renderContent = () => {
    if (!selectedFace || !strategy) {
      return (
        <div
          role="alert"
          className="flex items-center justify-center w-full h-full bg-slate-100 text-slate-800 text-sm p-4"
        >
          {uiLabels.unknownFaceType}
        </div>
      );
    }

    const useStaticFallback =
      renderMode === "static" ||
      (renderMode === "auto" &&
        strategy.requiresWebGL &&
        isHeadlessOrTestEnvironment());

    if (useStaticFallback) {
      return <StaticFaceFallback showSprites={showStaticSprites} />;
    }

    return (
      <Suspense fallback={<FaceViewSkeleton label={uiLabels.loading} />}>
        {strategy.render({ face: selectedFace, isPreview, frozen })}
      </Suspense>
    );
  };

  return (
    <div
      id="face-view-container"
      className={cn(
        "relative w-full h-full text-center overflow-hidden",
        className,
      )}
    >
      {renderContent()}
      {!isPreview && <FaceCaption />}
    </div>
  );
}
