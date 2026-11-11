import { useMemo } from "react";
import { Sprite, Texture } from "pixi.js";
import { useApplication, useExtend } from "@pixi/react";

function createRadialGradientTexture(size: number): Texture {
  if (typeof document === "undefined") {
    return Texture.EMPTY;
  }
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  if (!ctx) return Texture.EMPTY;

  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );

  gradient.addColorStop(0, "rgba(255, 255, 255, 0.7)");
  gradient.addColorStop(0.4, "rgba(255, 255, 255, 0.2)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  return Texture.from(canvas);
}

export function FaceBackground() {
  useExtend({ Sprite });
  const { app, isInitialised } = useApplication();

  const texture = useMemo(() => createRadialGradientTexture(1024), []);

  if (!app || !isInitialised || !app.renderer) return null;

  const screenWidth =
    (app.renderer.screen && app.renderer.screen.width) ||
    app.renderer.width ||
    2000;
  const screenHeight =
    (app.renderer.screen && app.renderer.screen.height) ||
    app.renderer.height ||
    2000;
  const size = Math.max(screenWidth, screenHeight) * 2;

  return (
    <pixiSprite
      texture={texture}
      anchor={0.5}
      width={size}
      height={size}
      x={0}
      y={0}
      blendMode="screen"
      alpha={0.5}
    />
  );
}

export default FaceBackground;
