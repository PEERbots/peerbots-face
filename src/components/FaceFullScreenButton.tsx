import { useCallback, useEffect, useState } from "react";
import { useApplication, useExtend } from "@pixi/react";
import { Container, Graphics, Rectangle } from "pixi.js";
import { iconPaths } from "@peerbots/core";

export function FaceFullScreenButton() {
  useExtend({ Graphics, Container });
  const { app } = useApplication();
  const [fullScreen, setFullScreen] = useState<boolean>(false);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    const handleFullscreenChange = () => {
      setFullScreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullScreen = useCallback(() => {
    if (typeof document === "undefined") {
      return;
    }
    if (fullScreen) {
      void document.exitFullscreen().catch((err) => {
        console.warn("Exit fullscreen error:", err);
      });
    } else {
      const container = document.getElementById("face-view-container");
      if (container) {
        container.requestFullscreen().catch((err) => {
          console.warn("Container fullscreen error:", err);
          if (app?.canvas) {
            void app.canvas.requestFullscreen().catch((canvasErr) => {
              console.warn("Canvas fullscreen error:", canvasErr);
            });
          }
        });
      } else if (app?.canvas) {
        void app.canvas.requestFullscreen().catch((err) => {
          console.warn("Canvas fullscreen error:", err);
        });
      }
    }
  }, [app, fullScreen]);

  const drawIcon = useCallback(
    (graphics: Graphics) => {
      graphics.clear();
      const pathD = fullScreen
        ? iconPaths.arrowsPointingIn
        : iconPaths.arrowsPointingOut;
      graphics.svg(`
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="black">
          <path strokeLinecap="round" strokeLinejoin="round" d="${pathD}" />
        </svg>
      `);
    },
    [fullScreen],
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
