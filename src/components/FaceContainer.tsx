import { useState, useEffect } from "react";
import { Container, type Renderer } from "pixi.js";
import { useApplication, useExtend, useTick } from "@pixi/react";
import { useFaceStore } from "../store/FaceStoreContext";
import {
  color_mapping,
  interpolateColor,
  rgbaToHex,
} from "../helpers/color_mappers";
import { FaceEyes } from "./FaceEyes";
import { FaceMouth } from "./FaceMouth";
import { FaceText } from "./FaceText";
import { FaceBackground } from "./FaceBackground";

function stepRendererBackgroundColor(renderer: Renderer, targetHex: string): void {
  try {
    const currentHex = renderer.background.color.toHex();
    if (currentHex.toLowerCase() === targetHex.toLowerCase()) {
      return;
    }
    const interpolated = interpolateColor(currentHex, targetHex, 0.1);
    if (interpolated !== null) {
      renderer.background.color = rgbaToHex(interpolated);
    }
  } catch (err) {
    void err;
  }
}

export function FaceContainer({ frozen = false }: { frozen?: boolean }) {
  useExtend({ Container });
  const settings = useFaceStore((state) => state.faceSettings);
  const selectedFace = useFaceStore((state) => state.selectedFace);
  const lastMessage = useFaceStore((state) => state.lastMessage);
  const { app, isInitialised } = useApplication();
  const [layout, setLayout] = useState({
    landscape: true,
    scale: 1,
    x: 400,
    y: 300,
  });

  const isAvatar =
    selectedFace?.kind === "PixiFace" && selectedFace.type === "avatar";

  useEffect(() => {
    if (!app || !isInitialised || !app.renderer) return;

    const updateLayout = () => {
      if (!app?.renderer) return;
      const width =
        (app.renderer.screen && app.renderer.screen.width) ||
        app.renderer.width ||
        800;
      const height =
        (app.renderer.screen && app.renderer.screen.height) ||
        app.renderer.height ||
        600;
      const isLandscape = width > height;
      const baseScale = isLandscape ? width / 1200 : height / 1200;
      const effectiveLandscape = settings.autoRotate ? isLandscape : true;

      setLayout({
        landscape: effectiveLandscape,
        scale: baseScale,
        x: width / 2,
        y: height / 2,
      });
    };

    updateLayout();

    const onResize = () => {
      if (app?.renderer) {
        updateLayout();
      }
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    app.renderer.on("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      if (app?.renderer) {
        app.renderer.off("resize", onResize);
      }
    };
  }, [app, isInitialised, settings.autoRotate]);

  useTick(() => {
    if (app?.renderer && lastMessage) {
      const targetColor =
        color_mapping[lastMessage.color] ?? color_mapping["Light Blue"];
      stepRendererBackgroundColor(app.renderer, targetColor);
    }
  });

  return (
    <pixiContainer
      label="FaceContainer"
      position={{
        x: layout.x + (settings.offset?.x ?? 0),
        y: layout.y + (settings.offset?.y ?? 0),
      }}
      pivot={{ x: 0.5, y: 0.5 }}
      angle={layout.landscape ? settings.rotation : 90 + settings.rotation}
    >
      {isAvatar && <FaceBackground />}
      {selectedFace?.kind === "PixiFace" && selectedFace.type === "text" ? (
        <FaceText scale={layout.scale * settings.zoom} />
      ) : (
        <>
          <FaceEyes scale={layout.scale * settings.zoom} frozen={frozen} />
          <FaceMouth scale={layout.scale * settings.zoom} frozen={frozen} />
        </>
      )}
    </pixiContainer>
  );
}

export default FaceContainer;
