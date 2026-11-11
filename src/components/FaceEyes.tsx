import {
  Sprite,
  Texture,
  Graphics,
  Spritesheet,
  Container,
  Assets,
} from "pixi.js";
import { useTick, useExtend } from "@pixi/react";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import type { Face } from "../types/face";
import { useFaceStore } from "../store/FaceStoreContext";

interface EyePositions {
  leftEyeX: number;
  leftEyeY: number;
  rightEyeX: number;
  rightEyeY: number;
  leftEyeToRightEyeScaleRatio: number;
  cheekYOffset: number;
  eyebrowMultiplier: number;
  eyebrowOffset: number;
}

const EYEBROW_POINTS = [
  { x: -5, y: 2.5 },
  { x: -4, y: 1.6 },
  { x: -3, y: 0.9 },
  { x: -2, y: 0.4 },
  { x: -1, y: 0.1 },
  { x: 0, y: 0 },
  { x: 1, y: 0.1 },
  { x: 2, y: 0.4 },
  { x: 3, y: 0.9 },
  { x: 4, y: 1.6 },
  { x: 5, y: 2.5 },
];

export function FaceEyes({
  scale,
  frozen = false,
}: {
  scale: number;
  frozen?: boolean;
}) {
  const message = useFaceStore((state) => state.lastMessage);
  const face = useFaceStore((state) => state.selectedFace);
  const gaze = useFaceStore((state) => state.gaze);
  const pixiSettings = useFaceStore((state) => state.faceSettings.pixiSettings);
  useExtend({ Container, Sprite, Graphics });

  const [faceSheet, setFaceSheet] = useState<Spritesheet | null>(null);
  const [cheekTexture, setCheekTexture] = useState<Texture | null>(null);
  const [eyeBrows, setEyeBrows] = useState<string | null>("Hugo");

  const leftEyeTexture = useMemo(() => {
    if (!faceSheet) return Texture.EMPTY;
    const emotion = message?.emotion || "Neutral";
    return (
      faceSheet.textures?.[`${emotion.toLowerCase()}_l.png`] ||
      faceSheet.textures?.["neutral_l.png"] ||
      Texture.EMPTY
    );
  }, [message, faceSheet]);

  const rightEyeTexture = useMemo(() => {
    if (!faceSheet) return Texture.EMPTY;
    const emotion = message?.emotion || "Neutral";
    return (
      faceSheet.textures?.[`${emotion.toLowerCase()}_r.png`] ||
      faceSheet.textures?.["neutral_r.png"] ||
      Texture.EMPTY
    );
  }, [message, faceSheet]);

  const breathingScaleRef = useRef(1);
  const breathingTimeRef = useRef(0);

  const blinkScaleRef = useRef(1);
  const isBlinkingRef = useRef(false);
  const blinkEveryRef = useRef(500);
  const blinkTimerRef = useRef(0);
  const blinkTargetScaleRef = useRef(1);
  const currentGazeRef = useRef({ x: 0, y: 0 });

  const leftEyeContainerRef = useRef<Container>(null);
  const rightEyeContainerRef = useRef<Container>(null);
  const leftEyebrowRef = useRef<Graphics>(null);
  const rightEyebrowRef = useRef<Graphics>(null);
  const leftEyeSpriteRef = useRef<Sprite>(null);
  const rightEyeSpriteRef = useRef<Sprite>(null);
  const leftCheekRef = useRef<Sprite>(null);
  const rightCheekRef = useRef<Sprite>(null);

  const positions = useMemo<EyePositions>(() => {
    return {
      leftEyeX: -300 * scale,
      rightEyeX: 300 * scale,
      leftEyeY: 0,
      rightEyeY: 0,
      leftEyeToRightEyeScaleRatio: 1.1,
      cheekYOffset: 150 * scale,
      eyebrowMultiplier: 7.5 * scale,
      eyebrowOffset: -180 * scale,
    };
  }, [scale]);

  useTick((ticker) => {
    const deltaTime = frozen ? 0 : ticker.deltaTime;

    const frequency = 0.00785;
    breathingTimeRef.current += deltaTime;
    breathingScaleRef.current =
      1 + 0.1 * Math.sin(breathingTimeRef.current * frequency);

    const blinkDuration = 20;
    const blinkSpeed = 0.5;

    blinkTimerRef.current += deltaTime;

    if (isBlinkingRef.current) {
      if (blinkTimerRef.current > blinkDuration) {
        blinkEveryRef.current = 200 + Math.random() * 400;
        blinkTargetScaleRef.current = 1;
        isBlinkingRef.current = false;
        blinkTimerRef.current = 0;
      }
    } else if (blinkTimerRef.current > blinkEveryRef.current) {
      blinkTargetScaleRef.current = 0.05;
      isBlinkingRef.current = true;
      blinkTimerRef.current = 0;
    }

    blinkScaleRef.current +=
      (blinkTargetScaleRef.current - blinkScaleRef.current) *
      blinkSpeed *
      deltaTime;

    currentGazeRef.current.x += (gaze.x - currentGazeRef.current.x) * 0.15;
    currentGazeRef.current.y += (gaze.y - currentGazeRef.current.y) * 0.15;
    const gazeOffsetX = currentGazeRef.current.x * 40 * scale;
    const gazeOffsetY = currentGazeRef.current.y * 30 * scale;

    if (leftEyeContainerRef.current) {
      leftEyeContainerRef.current.x = positions.leftEyeX + gazeOffsetX;
      leftEyeContainerRef.current.y = positions.leftEyeY + gazeOffsetY;
    }
    if (rightEyeContainerRef.current) {
      rightEyeContainerRef.current.x = positions.rightEyeX + gazeOffsetX;
      rightEyeContainerRef.current.y = positions.rightEyeY + gazeOffsetY;
    }

    const breathe = breathingScaleRef.current;
    const blink = blinkScaleRef.current;

    if (leftEyeSpriteRef.current) {
      leftEyeSpriteRef.current.scale.x =
        positions.leftEyeToRightEyeScaleRatio * breathe * scale;
      leftEyeSpriteRef.current.scale.y =
        positions.leftEyeToRightEyeScaleRatio * breathe * blink * scale;
    }
    if (rightEyeSpriteRef.current) {
      rightEyeSpriteRef.current.scale.x = 1 * breathe * scale;
      rightEyeSpriteRef.current.scale.y = 1 * breathe * blink * scale;
    }
    if (leftCheekRef.current) {
      leftCheekRef.current.scale.x = 0.08 * breathe * scale;
      leftCheekRef.current.scale.y = 0.04 * breathe * scale;
    }
    if (rightCheekRef.current) {
      rightCheekRef.current.scale.x = 0.08 * breathe * scale;
      rightCheekRef.current.scale.y = 0.04 * breathe * scale;
    }

    const strokeWidth = Math.max(1.5, 3 * scale);

    if (leftEyebrowRef.current) {
      const g = leftEyebrowRef.current;
      g.clear();
      const mult = positions.eyebrowMultiplier * breathe;
      g.moveTo(EYEBROW_POINTS[0].x * mult, EYEBROW_POINTS[0].y * mult);
      for (let i = 1; i < EYEBROW_POINTS.length; i++) {
        g.lineTo(EYEBROW_POINTS[i].x * mult, EYEBROW_POINTS[i].y * mult);
      }
      g.stroke({
        width: strokeWidth,
        color: "black",
        cap: "round",
        join: "round",
      });
    }

    if (rightEyebrowRef.current) {
      const g = rightEyebrowRef.current;
      g.clear();
      const mult = positions.eyebrowMultiplier * breathe;
      g.moveTo(EYEBROW_POINTS[0].x * mult, EYEBROW_POINTS[0].y * mult);
      for (let i = 1; i < EYEBROW_POINTS.length; i++) {
        g.lineTo(EYEBROW_POINTS[i].x * mult, EYEBROW_POINTS[i].y * mult);
      }
      g.stroke({
        width: strokeWidth,
        color: "black",
        cap: "round",
        join: "round",
      });
    }
  });

  const drawEyebrow = useCallback(
    (g: Graphics) => {
      g.clear();
      const mult = positions.eyebrowMultiplier * breathingScaleRef.current;
      const strokeWidth = Math.max(1.5, 3 * scale);
      g.moveTo(EYEBROW_POINTS[0].x * mult, EYEBROW_POINTS[0].y * mult);
      for (let i = 1; i < EYEBROW_POINTS.length; i++) {
        g.lineTo(EYEBROW_POINTS[i].x * mult, EYEBROW_POINTS[i].y * mult);
      }
      g.stroke({
        width: strokeWidth,
        color: "black",
        cap: "round",
        join: "round",
      });
    },
    [positions.eyebrowMultiplier, scale],
  );

  useEffect(() => {
    let cancelled = false;
    async function loadAvatarTextures(currentFace?: Face) {
      if (currentFace?.kind !== "PixiFace" || currentFace.type !== "avatar") {
        return;
      }
      try {
        if (currentFace.eyes?.kind === "spritesheet") {
          const sheet: Spritesheet = await Assets.load(currentFace.eyes.path);
          if (!cancelled) {
            setFaceSheet(sheet);
          }
        }
        if (currentFace.cheeks?.kind === "texture") {
          const cheek: Texture = await Assets.load(currentFace.cheeks.path);
          if (!cancelled) {
            setCheekTexture(cheek);
          }
        } else if (!cancelled) {
          setCheekTexture(null);
        }
        if (!cancelled) {
          setEyeBrows(currentFace.eyebrows);
        }
      } catch (err) {
        console.warn("Failed to load PixiFace textures:", err);
      }
    }
    void loadAvatarTextures(face);
    return () => {
      cancelled = true;
    };
  }, [face]);

  if (pixiSettings?.eyeDisplay === "none") {
    return null;
  }

  return (
    <>
      <pixiContainer
        ref={leftEyeContainerRef}
        position={{ x: positions.leftEyeX, y: positions.leftEyeY }}
        label="LeftEyeContainer"
      >
        {eyeBrows === "Hugo" && (
          <pixiGraphics
            ref={leftEyebrowRef}
            label="LeftEyebrow"
            position={{ x: 0, y: positions.eyebrowOffset }}
            draw={drawEyebrow}
          />
        )}
        <pixiSprite
          ref={leftEyeSpriteRef}
          label="LeftEye"
          anchor={{ x: 0.5, y: 0.5 }}
          position={{ x: 0, y: 0 }}
          texture={leftEyeTexture}
          pivot={{ x: 0.5, y: 0.5 }}
        />
        {cheekTexture && pixiSettings?.cheekDisplay !== "none" && (
          <pixiSprite
            ref={leftCheekRef}
            label="LeftCheek"
            texture={cheekTexture}
            pivot={{ x: 0.5, y: 0.5 }}
            anchor={{ x: 0.5, y: 0.5 }}
            position={{ x: 0, y: positions.cheekYOffset }}
          />
        )}
      </pixiContainer>
      <pixiContainer
        ref={rightEyeContainerRef}
        position={{ x: positions.rightEyeX, y: positions.rightEyeY }}
        label="RightEyeContainer"
      >
        {eyeBrows === "Hugo" && (
          <pixiGraphics
            ref={rightEyebrowRef}
            label="RightEyebrow"
            position={{ x: 0, y: positions.eyebrowOffset }}
            draw={drawEyebrow}
          />
        )}
        <pixiSprite
          ref={rightEyeSpriteRef}
          label="RightEye"
          position={{ x: 0, y: 0 }}
          pivot={{ x: 0.5, y: 0.5 }}
          anchor={{ x: 0.5, y: 0.5 }}
          texture={rightEyeTexture}
        />
        {cheekTexture && pixiSettings?.cheekDisplay !== "none" && (
          <pixiSprite
            ref={rightCheekRef}
            label="RightCheek"
            texture={cheekTexture}
            pivot={{ x: 0.5, y: 0.5 }}
            anchor={{ x: 0.5, y: 0.5 }}
            position={{ x: 0, y: positions.cheekYOffset }}
          />
        )}
      </pixiContainer>
    </>
  );
}

export default FaceEyes;
