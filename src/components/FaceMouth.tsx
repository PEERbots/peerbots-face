import { useRef, useMemo, useCallback } from "react";
import { Graphics } from "pixi.js";
import { useTick, useExtend } from "@pixi/react";
import { useFaceStore } from "../store/FaceStoreContext";

const ZIG_ZAG_POINTS = [
  { x: 0, y: -10 },
  { x: 10, y: 10 },
  { x: 20, y: -10 },
  { x: 30, y: 10 },
  { x: 40, y: -10 },
  { x: 50, y: 10 },
  { x: 60, y: -10 },
  { x: 70, y: 10 },
  { x: 80, y: -10 },
  { x: 90, y: 10 },
  { x: 100, y: -10 },
  { x: 110, y: 10 },
];

const SMILEY_POINTS = [
  { x: -40, y: 40 },
  { x: -30, y: 30 },
  { x: -20, y: 20 },
  { x: -10, y: 10 },
  { x: 0, y: 0 },
  { x: 10, y: 10 },
  { x: 20, y: 20 },
  { x: 30, y: 30 },
  { x: 40, y: 40 },
];

export function FaceMouth({
  scale,
  frozen = false,
}: {
  scale: number;
  frozen?: boolean;
}) {
  useExtend({ Graphics });

  const talking = useFaceStore((state) => state.isSpeaking);
  const face = useFaceStore((state) => state.selectedFace);
  const pixiSettings = useFaceStore((state) => state.faceSettings.pixiSettings);
  const currentAmplitude = useFaceStore((state) => state.currentAmplitude);
  const amplitudeData = useFaceStore((state) => state.amplitudeData);
  const speechStartTime = useFaceStore((state) => state.speechStartTime);

  const talkingScaleRef = useRef<number>(1);
  const talkingTimeRef = useRef<number>(0);

  const talkingShape = useMemo(
    () =>
      face?.kind === "PixiFace" && face.type === "avatar"
        ? face.mouth
        : "Ellipse",
    [face],
  );

  const graphicsRef = useRef<Graphics>(null);

  const getAmplitudeAtTime = useCallback(
    (timeMs: number): number => {
      if (!amplitudeData || amplitudeData.length === 0) return 0;
      const point = amplitudeData.find((p, i) => {
        const nextPoint = amplitudeData[i + 1];
        return p.time <= timeMs && (!nextPoint || nextPoint.time > timeMs);
      });
      return point ? point.value : 0;
    },
    [amplitudeData],
  );

  const drawMouth = useCallback(
    (graphics: Graphics) => {
      graphics.clear();
      const talkingScale = talkingScaleRef.current;
      const talkingTime = talkingTimeRef.current;

      switch (talkingShape) {
        case "Hugo": {
          const width = 40 * scale;
          const smileDepth = 20 * scale;
          const openHeight = talking ? talkingScale * 30 * scale : 0;
          const topLipLift = talking ? talkingScale * 10 * scale : 0;
          const centerY = scale * 240;

          graphics.moveTo(-width, centerY);
          graphics.quadraticCurveTo(
            0,
            centerY + smileDepth * 0.5 - topLipLift,
            width,
            centerY,
          );
          graphics.quadraticCurveTo(
            0,
            centerY + smileDepth + openHeight * 1.5,
            -width,
            centerY,
          );
          graphics.fill({ color: "black" });
          break;
        }
        case "Beak": {
          SMILEY_POINTS.forEach((eachPoint, index) => {
            const y =
              talkingScale *
                (Math.pow(40, 1.1) - Math.pow(Math.abs(eachPoint.x), 1.1)) +
              scale * 240;
            if (index === 0) {
              graphics.moveTo(eachPoint.x, y);
            }
            graphics.lineTo(eachPoint.x, y);
          });
          graphics.moveTo(SMILEY_POINTS[0].x, -1 * SMILEY_POINTS[0].y);
          SMILEY_POINTS.forEach((eachPoint, index) => {
            const y =
              -1 *
                talkingScale *
                (Math.pow(40, 1.1) - Math.pow(Math.abs(eachPoint.x), 1.1)) +
              scale * 240;
            if (index === 0) {
              graphics.moveTo(eachPoint.x, y);
            }
            graphics.lineTo(eachPoint.x, y);
          });
          break;
        }
        case "ZigZag": {
          ZIG_ZAG_POINTS.forEach((eachPoint, index) => {
            const x =
              eachPoint.x - ZIG_ZAG_POINTS[ZIG_ZAG_POINTS.length - 1].x / 2;
            const y = talking
              ? Math.sin(talkingTime * 0.3 + index * 5) * (10 * talkingScale) +
                scale * 240
              : eachPoint.y + scale * 240;
            if (index === 0) {
              graphics.moveTo(x, y);
            }
            graphics.lineTo(x, y);
          });
          break;
        }
        case "Ellipse":
        default: {
          graphics.ellipse(
            0,
            scale * 240,
            scale * 60,
            talking ? 2 + talkingScale * scale * 15 : 4,
          );
          graphics.fill({ color: "black" });
          break;
        }
      }
      graphics.stroke({ color: "black", width: 2 });
    },
    [scale, talking, talkingShape],
  );

  useTick((time) => {
    if (frozen) return;

    let targetScale: number;
    if (talking) {
      if (currentAmplitude > 0) {
        targetScale = Math.min(currentAmplitude * 1.5, 1);
      } else if (amplitudeData && speechStartTime) {
        const elapsed = performance.now() - speechStartTime;
        targetScale = Math.min(getAmplitudeAtTime(elapsed) * 1.5, 1);
      } else {
        targetScale = Math.abs(Math.sin(time.lastTime * 0.1));
      }
      talkingTimeRef.current = time.lastTime;
    } else {
      targetScale = 0;
    }

    const lerpAlpha = 0.2;
    talkingScaleRef.current +=
      (targetScale - talkingScaleRef.current) * lerpAlpha;

    if (graphicsRef.current) {
      drawMouth(graphicsRef.current);
    }
  });

  if (pixiSettings?.mouthDisplay === "none") return null;

  return <pixiGraphics ref={graphicsRef} label="Mouth" draw={drawMouth} />;
}

export default FaceMouth;
