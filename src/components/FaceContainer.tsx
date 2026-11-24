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
import { resolveAvatarBackgroundHex } from "./vectorFaces/drawVectorFace";

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
      const effectiveLandscape = settings.autoRotate ? isLandscape : true;
      const effectiveAngle =
        (((effectiveLandscape ? settings.rotation : 90 + settings.rotation) %
          360) +
          360) %
        360;
      const isQuarterTurn =
        Math.abs(effectiveAngle - 90) < 45 ||
        Math.abs(effectiveAngle - 270) < 45;

      // Fit canonical face bounds (1000x660) inside the viewport in both dimensions
      // so the face never clips off-screen in wide/short or tall/narrow containers.
      const availW = isQuarterTurn ? height : width;
      const availH = isQuarterTurn ? width : height;
      const baseScale = Math.min(availW / 1000, availH / 660);

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

    let observer: ResizeObserver | null = null;
    const canvasEl = app.canvas;
    if (typeof ResizeObserver !== "undefined" && canvasEl?.parentElement) {
      observer = new ResizeObserver(onResize);
      observer.observe(canvasEl.parentElement);
    }

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      if (app?.renderer) {
        app.renderer.off("resize", onResize);
      }
      observer?.disconnect();
    };
  }, [app, isInitialised, settings.autoRotate, settings.rotation]);

  useTick(() => {
    if (app?.renderer && lastMessage) {
      const themeHex =
        color_mapping[lastMessage.color] ?? color_mapping["Light Blue"];
      const colorRole =
        selectedFace?.kind === "PixiFace" && selectedFace.type === "avatar"
          ? (selectedFace.colorRole ?? "background")
          : "background";
      const targetColor = resolveAvatarBackgroundHex(themeHex, colorRole);
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
