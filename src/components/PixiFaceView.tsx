import { useState } from "react";
import { Application, useExtend } from "@pixi/react";
import { Container, Graphics, Sprite, Text } from "pixi.js";
import {
  FaceStoreContext,
  useFaceStore,
  useFaceStoreInstance,
} from "../store/FaceStoreContext";
import { FaceContainer } from "./FaceContainer";
import { FaceFullScreenButton } from "./FaceFullScreenButton";
import { FaceScrollToTopButton } from "./FaceScrollToTopButton";

export interface PixiFaceViewProps {
  isPreview?: boolean;
  frozen?: boolean;
}

export function PixiFaceView({
  isPreview = false,
  frozen = false,
}: PixiFaceViewProps = {}) {
  useExtend({ Container, Graphics, Sprite, Text });
  const settings = useFaceStore((state) => state.faceSettings);
  const currentStore = useFaceStoreInstance();
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);

  return (
    <div
      ref={setContainerEl}
      className="w-full h-full relative overflow-hidden"
      data-testid="pixi-face-view"
    >
      {containerEl ? (
        <Application
          resizeTo={containerEl}
          backgroundColor="#ABE3FA"
          className="w-full h-full block"
        >
          <FaceStoreContext.Provider value={currentStore}>
            {!isPreview && settings.showFullScreenButton && (
              <FaceFullScreenButton />
            )}
            {!isPreview && settings.showScrollButton && (
              <FaceScrollToTopButton />
            )}
            <FaceContainer frozen={frozen} />
          </FaceStoreContext.Provider>
        </Application>
      ) : null}
    </div>
  );
}

export default PixiFaceView;
