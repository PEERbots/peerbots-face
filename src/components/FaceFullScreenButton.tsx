import { useCallback, useRef } from "react";
import { useApplication, useExtend } from "@pixi/react";
import { Container, Graphics, Rectangle } from "pixi.js";
import { iconPaths } from "@peerbots/core";
import {
  useFaceFullscreenContext,
  useFullscreen,
} from "../hooks/useFullscreen";

export function FaceFullScreenButton() {
  useExtend({ Graphics, Container });
  const { app } = useApplication();
  const contextFullscreen = useFaceFullscreenContext();
  const fallbackRef = useRef<HTMLElement | null>(null);
  const fallbackFullscreen = useFullscreen(fallbackRef);

  const isFullscreen = contextFullscreen
    ? contextFullscreen.isFullscreen
    : fallbackFullscreen.isFullscreen;

  const toggleFullScreen = useCallback(() => {
    if (contextFullscreen) {
      void contextFullscreen.toggleFullscreen();
      return;
    }
    if (typeof document !== "undefined") {
      fallbackRef.current =
        document.getElementById("face-view-container") ??
        (app?.canvas instanceof HTMLElement ? app.canvas : null);
    }
    void fallbackFullscreen.toggleFullscreen();
  }, [app, contextFullscreen, fallbackFullscreen]);

  const drawIcon = useCallback(
    (graphics: Graphics) => {
      graphics.clear();
      const pathD = isFullscreen
        ? iconPaths.arrowsPointingIn
        : iconPaths.arrowsPointingOut;
      graphics.svg(`
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="black">
          <path strokeLinecap="round" strokeLinejoin="round" d="${pathD}" />
        </svg>
      `);
    },
    [isFullscreen],
  );

  return (
    <pixiContainer
      label="FullScreenToggle"
      x={20}
      y={20}
      eventMode="static"
      onPointerDown={toggleFullScreen}
      hitArea={new Rectangle(0, 0, 50, 50)}
    >
      <pixiGraphics
        onPointerDown={toggleFullScreen}
        eventMode="static"
        draw={drawIcon}
      />
    </pixiContainer>
  );
}

export default FaceFullScreenButton;
