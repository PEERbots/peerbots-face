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
import type { Face, PeerbotsEmotion } from "../types/face";
import { useFaceStore } from "../store/FaceStoreContext";
import { color_mapping } from "../helpers/color_mappers";
import {
  NEUTRAL_POSE,
  resolveConversationGazeOffset,
  resolveTargetPose,
  stepFacePose,
  type FacePose,
} from "../helpers/face_poses";
import {
  drawVectorEyes,
  resolveAvatarBackgroundHex,
} from "./vectorFaces/drawVectorFace";

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
  const blinkNonce = useFaceStore((state) => state.blinkNonce);
  const conversationState = useFaceStore((state) => state.conversationState);
  const extendedExpression = useFaceStore((state) => state.extendedExpression);
  const facsOverrides = useFaceStore((state) => state.facsOverrides);
  const faceSettings = useFaceStore((state) => state.faceSettings);
  const pixiSettings = faceSettings.pixiSettings;
  useExtend({ Container, Sprite, Graphics });

  const isVectorAvatar =
    face?.kind === "PixiFace" &&
    face.type === "avatar" &&
    face.eyes.kind === "vector";
  const vectorStyle = isVectorAvatar && face.eyes.kind === "vector" ? face.eyes.style : null;
  const colorRole =
    face?.kind === "PixiFace" && face.type === "avatar"
      ? (face.colorRole ?? "background")
      : "background";

  const [faceSheet, setFaceSheet] = useState<Spritesheet | null>(null);
  const [cheekTexture, setCheekTexture] = useState<Texture | null>(null);
  const [eyeBrows, setEyeBrows] = useState<string | null>("Hugo");

  // Smooth blink-masked emotion swap for spritesheet faces (e.g. Robotic)
  const targetEmotion: PeerbotsEmotion = message?.emotion || "Neutral";
  const [displayedSpriteEmotion, setDisplayedSpriteEmotion] =
    useState<PeerbotsEmotion>(targetEmotion);
  const pendingSpriteEmotionRef = useRef<PeerbotsEmotion | null>(null);

  const leftEyeTexture = useMemo(() => {
    if (!faceSheet) return Texture.EMPTY;
    return (
      faceSheet.textures?.[`${displayedSpriteEmotion.toLowerCase()}_l.png`] ||
      faceSheet.textures?.["neutral_l.png"] ||
      Texture.EMPTY
    );
  }, [displayedSpriteEmotion, faceSheet]);

  const rightEyeTexture = useMemo(() => {
    if (!faceSheet) return Texture.EMPTY;
    return (
      faceSheet.textures?.[`${displayedSpriteEmotion.toLowerCase()}_r.png`] ||
      faceSheet.textures?.["neutral_r.png"] ||
      Texture.EMPTY
    );
  }, [displayedSpriteEmotion, faceSheet]);

  const breathingTimeRef = useRef(0);
  const blinkScaleRef = useRef(1);
  const isBlinkingRef = useRef(false);
  const blinkPhaseRef = useRef(0);
  const blinkEveryRef = useRef(4.2);
  const blinkTimerRef = useRef(0);
  const currentGazeRef = useRef({ x: 0, y: 0 });
  const currentPoseRef = useRef<FacePose>({ ...NEUTRAL_POSE });
  const prevBlinkNonceRef = useRef(blinkNonce);

  const vectorEyesRef = useRef<Graphics>(null);
  const leftEyeContainerRef = useRef<Container>(null);
  const rightEyeContainerRef = useRef<Container>(null);
  const leftEyebrowRef = useRef<Graphics>(null);
  const rightEyebrowRef = useRef<Graphics>(null);
  const leftEyeSpriteRef = useRef<Sprite>(null);
  const rightEyeSpriteRef = useRef<Sprite>(null);
  const leftCheekRef = useRef<Sprite>(null);
  const rightCheekRef = useRef<Sprite>(null);

  const targetPose = useMemo(
    () =>
      resolveTargetPose(targetEmotion, {
        extendedExpression,
        expressivity: faceSettings.vizijSettings?.faceExpressivity ?? 1,
        conversationState,
        facsOverrides,
      }),
    [
      targetEmotion,
      extendedExpression,
      faceSettings.vizijSettings?.faceExpressivity,
      conversationState,
      facsOverrides,
    ],
  );

  // Trigger blink-masked swap on spritesheet faces when emotion changes
  useEffect(() => {
    if (isVectorAvatar) {
      setDisplayedSpriteEmotion(targetEmotion);
      return;
    }
    if (frozen) {
      setDisplayedSpriteEmotion(targetEmotion);
      pendingSpriteEmotionRef.current = null;
      return;
    }
    if (targetEmotion !== displayedSpriteEmotion) {
      pendingSpriteEmotionRef.current = targetEmotion;
      isBlinkingRef.current = true;
      blinkPhaseRef.current = 0;
    }
  }, [targetEmotion, displayedSpriteEmotion, isVectorAvatar, frozen]);

  // Honor on-demand triggerBlink() from the store
  useEffect(() => {
    if (blinkNonce !== prevBlinkNonceRef.current) {
      prevBlinkNonceRef.current = blinkNonce;
      isBlinkingRef.current = true;
      blinkPhaseRef.current = 0;
    }
  }, [blinkNonce]);

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

  const themeHex =
    color_mapping[message?.color ?? "Light Blue"] ?? color_mapping["Light Blue"];
  const resolvedBgHex = resolveAvatarBackgroundHex(
    themeHex,
    vectorStyle,
    colorRole,
  );

  const showVectorEyebrows =
    face?.kind === "PixiFace" &&
    face.type === "avatar" &&
    face.eyebrows !== null;
  const showVectorCheeks =
    face?.kind === "PixiFace" &&
    face.type === "avatar" &&
    face.cheeks !== null &&
    pixiSettings?.cheekDisplay !== "none";

  const drawVector = useCallback(
    (g: Graphics) => {
      if (!vectorStyle) return;
      const t = breathingTimeRef.current;
      const breatheLeft = 1 + 0.03 * Math.sin(t * 2.1);
      const breatheRight = 1 + 0.03 * Math.sin(t * 2.1 + 0.35);
      drawVectorEyes({
        graphics: g,
        style: vectorStyle,
        pose: frozen ? targetPose : currentPoseRef.current,
        scale,
        breatheLeft: frozen ? 1 : breatheLeft,
        breatheRight: frozen ? 1 : breatheRight,
        blink: frozen ? 1 : blinkScaleRef.current,
        gazeX: frozen ? gaze.x : currentGazeRef.current.x,
        gazeY: frozen ? gaze.y : currentGazeRef.current.y,
        bgColor: resolvedBgHex,
        themeColor: themeHex,
        colorRole,
        showEyebrows: showVectorEyebrows,
        showCheeks: showVectorCheeks,
      });
    },
    [
      vectorStyle,
      frozen,
      targetPose,
      scale,
      gaze.x,
      gaze.y,
      resolvedBgHex,
      themeHex,
      colorRole,
      showVectorEyebrows,
      showVectorCheeks,
    ],
  );

  useTick((ticker) => {
    const dtSeconds = frozen ? 0 : Math.min(0.05, ticker.deltaMS / 1000);
    breathingTimeRef.current += dtSeconds;
    const t = breathingTimeRef.current;

    // Smooth sinusoidal blink envelope (~180ms)
    if (isBlinkingRef.current) {
      blinkPhaseRef.current += dtSeconds * 14;
      if (
        pendingSpriteEmotionRef.current &&
        blinkPhaseRef.current >= Math.PI / 2
      ) {
        setDisplayedSpriteEmotion(pendingSpriteEmotionRef.current);
        pendingSpriteEmotionRef.current = null;
      }
      if (blinkPhaseRef.current >= Math.PI) {
        isBlinkingRef.current = false;
        blinkPhaseRef.current = 0;
        blinkScaleRef.current = 1;
        blinkTimerRef.current = 0;
        blinkEveryRef.current = 2.8 + Math.random() * 4.0;
      } else {
        blinkScaleRef.current = Math.max(
          0.06,
          1 - Math.sin(blinkPhaseRef.current),
        );
      }
    } else if (!frozen) {
      blinkTimerRef.current += dtSeconds;
      if (blinkTimerRef.current >= blinkEveryRef.current) {
        isBlinkingRef.current = true;
        blinkPhaseRef.current = 0;
      }
    }

    // Gaze + subtle HRI conversation aversion when no explicit target is held
    const convGaze = resolveConversationGazeOffset(conversationState, t);
    const gazeWeight =
      gaze.weight ?? (Math.abs(gaze.x) > 0.001 || Math.abs(gaze.y) > 0.001 ? 1 : 0);
    const effectiveGazeX = gaze.x * gazeWeight + convGaze.x * (1 - gazeWeight);
    const effectiveGazeY = gaze.y * gazeWeight + convGaze.y * (1 - gazeWeight);

    const gazeAlpha = dtSeconds <= 0 ? 0 : 1 - Math.exp(-8 * dtSeconds);
    currentGazeRef.current.x +=
      (effectiveGazeX - currentGazeRef.current.x) * gazeAlpha;
    currentGazeRef.current.y +=
      (effectiveGazeY - currentGazeRef.current.y) * gazeAlpha;

    // Smooth parametric pose morphing
    currentPoseRef.current = frozen
      ? targetPose
      : stepFacePose(currentPoseRef.current, targetPose, dtSeconds, 9.5);

    if (isVectorAvatar) {
      if (vectorEyesRef.current) {
        drawVector(vectorEyesRef.current);
      }
      return;
    }

    // Legacy spritesheet path (e.g. Robotic)
    const breatheLeft = 1 + 0.06 * Math.sin(t * 2.0);
    const breatheRight = 1 + 0.06 * Math.sin(t * 2.0 + 0.35);
    const blink = blinkScaleRef.current;
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

    if (leftEyeSpriteRef.current) {
      leftEyeSpriteRef.current.scale.x =
        positions.leftEyeToRightEyeScaleRatio * breatheLeft * scale;
      leftEyeSpriteRef.current.scale.y =
        positions.leftEyeToRightEyeScaleRatio * breatheLeft * blink * scale;
    }
    if (rightEyeSpriteRef.current) {
      rightEyeSpriteRef.current.scale.x = 1 * breatheRight * scale;
      rightEyeSpriteRef.current.scale.y = 1 * breatheRight * blink * scale;
    }
    if (leftCheekRef.current) {
      leftCheekRef.current.scale.x = 0.08 * breatheLeft * scale;
      leftCheekRef.current.scale.y = 0.04 * breatheLeft * scale;
    }
    if (rightCheekRef.current) {
      rightCheekRef.current.scale.x = 0.08 * breatheRight * scale;
      rightCheekRef.current.scale.y = 0.04 * breatheRight * scale;
    }

    const strokeWidth = Math.max(1.5, 3 * scale);
    if (leftEyebrowRef.current) {
      const g = leftEyebrowRef.current;
      g.clear();
      const mult = positions.eyebrowMultiplier * breatheLeft;
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
      const mult = positions.eyebrowMultiplier * breatheRight;
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
      const mult = positions.eyebrowMultiplier;
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
        } else if (!cancelled) {
          setFaceSheet(null);
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

  if (isVectorAvatar) {
    return (
      <pixiGraphics
        ref={vectorEyesRef}
        label="VectorEyes"
        draw={drawVector}
      />
    );
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
