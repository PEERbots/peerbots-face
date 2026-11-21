import { lazy, Suspense, useRef } from "react";
import { faceCn as cn } from "../helpers/cn";
import { useFaceStore } from "../store/FaceStoreContext";
import { getFaceCapabilities, type PixiFace, type VizijFace } from "../types/face";
import {
  FaceRendererRegistry,
  type FaceRendererStrategy,
} from "../types/renderer";
import { resolveFaceUiLabels, type FaceUiLabels } from "../types/labels";
import { isHeadlessOrTestEnvironment } from "../helpers/environment";
import { FaceFullscreenContext, useFullscreen } from "../hooks/useFullscreen";
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
  /** Called whenever fullscreen state changes (native or CSS pseudo-fullscreen). */
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

export function FaceView({
  isPreview = false,
  frozen = false,
  renderMode = "auto",
  showStaticSprites = true,
  registry = defaultFaceRendererRegistry,
  labels,
  className,
  onFullscreenChange,
}: FaceViewProps = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fullscreenState = useFullscreen(containerRef, { onFullscreenChange });
  const uiLabels = resolveFaceUiLabels(labels);
  const selectedFace = useFaceStore((state) => state.selectedFace);
  const strategy = selectedFace ? registry.get(selectedFace.kind) : undefined;

  const renderContent = () => {
    if (!selectedFace || !strategy) {
      return (
        <div
          role="alert"
          className="pbf:flex pbf:items-center pbf:justify-center pbf:w-full pbf:h-full pbf:bg-slate-100 pbf:text-slate-800 pbf:text-sm pbf:p-4"
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
    <FaceFullscreenContext.Provider value={fullscreenState}>
      <div
        ref={containerRef}
        id="face-view-container"
        data-pseudo-fullscreen={
          fullscreenState.isPseudoFullscreen ? "true" : undefined
        }
        className={cn(
          "pbf:relative pbf:w-full pbf:h-full pbf:text-center pbf:overflow-hidden",
          fullscreenState.isPseudoFullscreen &&
            "pbf:fixed pbf:inset-0 pbf:z-[9999] pbf:w-screen pbf:h-[100dvh]",
          className,
        )}
      >
        {renderContent()}
        {!isPreview && <FaceCaption />}
      </div>
    </FaceFullscreenContext.Provider>
  );
}
