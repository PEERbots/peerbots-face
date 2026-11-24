import { describe, expect, it, vi } from "vitest";
import type { Graphics } from "pixi.js";
import peerbotsProfileJson from "../../public/FaceAssets/Profiles/peerbots-face.v1.json";
import {
  DEFAULT_FACE_MESSAGE,
  EMOTION_POSES,
  NEUTRAL_POSE,
  PEERBOTS_EMOTIONS,
  PEERBOTS_FACE_PROFILE,
  PEERBOTS_PROFILE_KEYS,
  VIZIJ_STANDARD_KEYS,
  buildProfileControlValues,
  createPeerbotsFaceStore,
  defaultFaceSettings,
  inspectGlbProfileConnection,
  resolveConversationGazeOffset,
  resolveTargetPose,
  stepFacePose,
  type VectorFaceStyleId,
} from "../../src";
import {
  DARK_VISOR_HEX,
  PULSE_VISOR_HEX,
  drawVectorEyes,
  drawVectorMouth,
  resolveAvatarBackgroundHex,
  resolveVectorInkHex,
} from "../../src/components/vectorFaces/drawVectorFace";

function createFakeGraphics(): Graphics {
  return {
    clear: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    closePath: vi.fn(),
    ellipse: vi.fn(),
    circle: vi.fn(),
    roundRect: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
  } as unknown as Graphics;
}

describe("Peerbots Vizij Profile (peerbots-face.v1.json)", () => {
  it("stays strictly in sync between the JSON asset and PEERBOTS_FACE_PROFILE constant", () => {
    expect(peerbotsProfileJson).toEqual(PEERBOTS_FACE_PROFILE);
    expect(peerbotsProfileJson.id).toBe("peerbots-face");
    expect(peerbotsProfileJson.version).toBe("v1");
    expect(peerbotsProfileJson.scope).toBe("face");
    expect(peerbotsProfileJson.keys.map((k) => k.path)).toEqual(
      Object.values(PEERBOTS_PROFILE_KEYS),
    );
    expect(peerbotsProfileJson.keys).toHaveLength(21);
  });

  it("inspects standard vizij-face + peerbots-face GLB paths and reports full auto-connection", () => {
    const paths = [
      "rig/hugo/standard/vizij/expression/neutral",
      "rig/hugo/standard/vizij/expression/happy",
      "rig/hugo/standard/vizij/expression/sad",
      "rig/hugo/standard/vizij/expression/surprised",
      "rig/hugo/standard/vizij/expression/concerned",
      "rig/hugo/standard/vizij/expression/sleepy",
      "rig/hugo/standard/vizij/gaze/target/x",
      "rig/hugo/standard/vizij/gaze/target/y",
      "rig/hugo/standard/vizij/gaze/target/weight",
      "rig/hugo/standard/vizij/blink",
      "rig/hugo/standard/vizij/viseme/aa",
      "rig/hugo/standard/vizij/viseme/PP",
      "rig/hugo/standard/vizij/conversation/speaking",
      "rig/hugo/standard/vizij/face/brow_inner_up",
      "rig/hugo/peerbots/color/r",
      "rig/hugo/peerbots/color/g",
      "rig/hugo/peerbots/color/b",
      "rig/hugo/peerbots/speech/amplitude",
      "rig/hugo/peerbots/scene/scale",
      "rig/hugo/peerbots/scene/offset/x",
      "rig/hugo/peerbots/scene/offset/y",
      "rig/hugo/peerbots/scene/rotation",
    ];

    const report = inspectGlbProfileConnection(paths, [
      "vizij-face",
      "peerbots-face",
    ]);

    expect(report.declaredProfiles).toEqual(["vizij-face", "peerbots-face"]);
    expect(report.emotions).toEqual({ connected: 6, total: 6, supported: true });
    expect(report.visemes).toEqual({ connected: 2, total: 15, supported: true });
    expect(report.gaze).toBe(true);
    expect(report.blink).toBe(true);
    expect(report.color).toBe(true);
    expect(report.amplitude).toBe(true);
    expect(report.sceneTransform).toEqual({
      scale: true,
      offset: true,
      rotation: true,
    });
    expect(report.conversation).toBe(true);
    expect(report.facs.connected).toBe(1);
    expect(report.usesLegacyRigPaths).toBe(false);
  });

  it("detects legacy pre-1.0 Vizij rig paths for backwards compatibility", () => {
    const legacyPaths = [
      "rig/hugo/emotions/happy.weight",
      "rig/hugo/emotions/sad.weight",
      "rig/hugo/background/color/r",
      "rig/hugo/background/color/g",
      "rig/hugo/background/color/b",
      "rig/hugo/visemes/a.weight",
      "rig/hugo/scene/scale/x",
      "rig/hugo/scene/translation/x",
      "rig/hugo/scene/translation/y",
    ];

    const report = inspectGlbProfileConnection(legacyPaths);
    expect(report.usesLegacyRigPaths).toBe(true);
    expect(report.emotions.connected).toBe(2);
    expect(report.color).toBe(true);
    expect(report.sceneTransform).toEqual({
      scale: true,
      offset: true,
      rotation: false,
    });
  });

  it("projects store state into canonical vizij-face + peerbots-face control values", () => {
    const values = buildProfileControlValues({
      message: {
        ...DEFAULT_FACE_MESSAGE,
        emotion: "Happy",
        color: "Red",
      },
      gaze: { x: 0.5, y: -0.5, weight: 0.8 },
      settings: {
        ...defaultFaceSettings,
        zoom: 1.5,
        rotation: 90,
        offset: { x: 250, y: -125 },
        vizijSettings: { faceExpressivity: 0.75 },
      },
      isSpeaking: true,
      currentAmplitude: 0.6,
      conversationState: "thinking",
      facsOverrides: { brow_inner_up: 0.4 },
      blinkLevel: 0.25,
    });

    expect(values[VIZIJ_STANDARD_KEYS.expression("happy")]).toBeCloseTo(0.75);
    expect(values[VIZIJ_STANDARD_KEYS.expression("sad")]).toBe(0);
    expect(values[VIZIJ_STANDARD_KEYS.gazeTargetX]).toBeCloseTo(0.75);
    expect(values[VIZIJ_STANDARD_KEYS.gazeTargetY]).toBeCloseTo(0.25);
    expect(values[VIZIJ_STANDARD_KEYS.gazeTargetWeight]).toBeCloseTo(0.8);
    expect(values[VIZIJ_STANDARD_KEYS.blink]).toBeCloseTo(0.25);
    expect(values[VIZIJ_STANDARD_KEYS.conversationSpeaking]).toBe(1);
    expect(values[VIZIJ_STANDARD_KEYS.conversationThinking]).toBe(1);
    expect(values[VIZIJ_STANDARD_KEYS.facs("brow_inner_up")]).toBeCloseTo(0.4);
    expect(values[PEERBOTS_PROFILE_KEYS.speechAmplitude]).toBeCloseTo(0.6);
    expect(values[PEERBOTS_PROFILE_KEYS.sceneScale]).toBe(1.5);
    expect(values[PEERBOTS_PROFILE_KEYS.sceneOffsetX]).toBeCloseTo(0.5);
    expect(values[PEERBOTS_PROFILE_KEYS.sceneOffsetY]).toBeCloseTo(-0.25);
    expect(values[PEERBOTS_PROFILE_KEYS.sceneRotation]).toBe(90);
    expect(values[PEERBOTS_PROFILE_KEYS.colorR]).toBeGreaterThan(0.5);
  });

  it("supports triggerBlink, conversationState, extendedExpression, facsOverrides, and gaze weight in the store", () => {
    const store = createPeerbotsFaceStore({ isSilent: true });
    expect(store.getState().blinkNonce).toBe(0);
    store.getState().triggerBlink();
    expect(store.getState().blinkNonce).toBe(1);

    store.getState().setConversationState("listening");
    expect(store.getState().conversationState).toBe("listening");

    store.getState().setExtendedExpression("skeptical");
    expect(store.getState().extendedExpression).toBe("skeptical");

    store.getState().setFacsOverrides({ brow_inner_up: 1.5, jaw_open: -0.2 });
    expect(store.getState().facsOverrides).toEqual({
      brow_inner_up: 1,
      jaw_open: 0,
    });

    store.getState().setGaze({ x: 0.25, y: -0.25, weight: 0.9 });
    expect(store.getState().gaze).toEqual({ x: 0.25, y: -0.25, weight: 0.9 });
  });
});

describe("Parametric FacePose solver & 8 PixiJS vector face styles", () => {
  it("resolves poses across all emotions, expressivity levels, conversation states, and FACS overrides", () => {
    for (const emo of PEERBOTS_EMOTIONS) {
      const full = resolveTargetPose(emo, { expressivity: 1 });
      expect(full).toEqual(EMOTION_POSES[emo]);

      const zero = resolveTargetPose(emo, { expressivity: 0 });
      expect(zero).toEqual(NEUTRAL_POSE);
    }

    const listening = resolveTargetPose("Neutral", {
      conversationState: "listening",
    });
    expect(listening.eyeHeight).toBeGreaterThan(NEUTRAL_POSE.eyeHeight);

    const thinking = resolveTargetPose("Neutral", {
      conversationState: "thinking",
    });
    expect(thinking.topLid).toBeGreaterThan(NEUTRAL_POSE.topLid);

    const facsPose = resolveTargetPose("Neutral", {
      facsOverrides: {
        brow_inner_up: 0.8,
        mouth_smile_left: 0.9,
        mouth_smile_right: 0.9,
        jaw_open: 0.6,
      },
    });
    expect(facsPose.mouthCurve).toBeGreaterThan(NEUTRAL_POSE.mouthCurve);
    expect(facsPose.mouthOpen).toBeCloseTo(0.6);

    const extended = resolveTargetPose("Neutral", {
      extendedExpression: "excited",
    });
    expect(extended.cheekAlpha).toBeGreaterThan(0.9);
  });

  it("smoothly interpolates between poses and computes thinking gaze aversion", () => {
    const mid = stepFacePose(NEUTRAL_POSE, EMOTION_POSES.Surprised, 0.1, 10);
    expect(mid.eyeHeight).toBeGreaterThan(NEUTRAL_POSE.eyeHeight);
    expect(mid.eyeHeight).toBeLessThan(EMOTION_POSES.Surprised.eyeHeight);

    const frozen = stepFacePose(NEUTRAL_POSE, EMOTION_POSES.Happy, 0, 10);
    expect(frozen).toEqual(NEUTRAL_POSE);

    const idleGaze = resolveConversationGazeOffset("idle", 1.0);
    expect(idleGaze).toEqual({ x: 0, y: 0 });

    const thinkGaze = resolveConversationGazeOffset("thinking", 1.0);
    expect(thinkGaze.x).toBeGreaterThan(0.2);
    expect(thinkGaze.y).toBeLessThan(-0.1);
  });

  it("resolves single-color roles and renders eyes & mouths for all 8 vector presets", () => {
    expect(resolveAvatarBackgroundHex("#FF0000", "hugo", "background")).toBe(
      "#FF0000",
    );
    expect(resolveAvatarBackgroundHex("#FF0000", "dash", "accent")).toBe(
      DARK_VISOR_HEX,
    );
    expect(resolveAvatarBackgroundHex("#FF0000", "pulse", "accent")).toBe(
      PULSE_VISOR_HEX,
    );

    expect(resolveVectorInkHex("#000000", "dash", "accent")).toBe("#38BDF8");
    expect(resolveVectorInkHex("#000000", "pulse", "accent")).toBe("#34D399");
    expect(resolveVectorInkHex("#000000", "pixel", "accent")).toBe("#FBBF24");
    expect(resolveVectorInkHex("#000000", "hugo", "background")).toBe("#F8FAFC");
    expect(resolveVectorInkHex("#38BDF8", "dash", "accent")).toBe("#38BDF8");

    const styles: VectorFaceStyleId[] = [
      "hugo",
      "mochi",
      "pebble",
      "dash",
      "orbit",
      "pulse",
      "pixel",
      "slate",
    ];

    for (const style of styles) {
      const colorRole =
        style === "dash" || style === "pulse" || style === "pixel"
          ? "accent"
          : "background";
      const bgColor = resolveAvatarBackgroundHex("#ABE3FA", style, colorRole);

      for (const emo of ["Neutral", "Happy", "Sad", "Surprised"] as const) {
        const gEyes = createFakeGraphics();
        drawVectorEyes({
          graphics: gEyes,
          style,
          pose: EMOTION_POSES[emo],
          scale: 0.75,
          breatheLeft: 1.01,
          breatheRight: 0.99,
          blink: 1,
          gazeX: 0.2,
          gazeY: -0.1,
          bgColor,
          themeColor: "#ABE3FA",
          colorRole,
          showEyebrows: true,
          showCheeks: true,
        });
        expect(gEyes.clear).toHaveBeenCalledTimes(1);

        const gMouthIdle = createFakeGraphics();
        drawVectorMouth({
          graphics: gMouthIdle,
          style,
          pose: EMOTION_POSES[emo],
          scale: 0.75,
          talking: false,
          talkingScale: 0,
          talkingTime: 0,
          bgColor,
          themeColor: "#ABE3FA",
          colorRole,
        });
        expect(gMouthIdle.clear).toHaveBeenCalledTimes(1);

        const gMouthTalk = createFakeGraphics();
        drawVectorMouth({
          graphics: gMouthTalk,
          style,
          pose: EMOTION_POSES[emo],
          scale: 0.75,
          talking: true,
          talkingScale: 0.85,
          talkingTime: 1200,
          bgColor,
          themeColor: "#ABE3FA",
          colorRole,
        });
        expect(gMouthTalk.clear).toHaveBeenCalledTimes(1);
      }
    }
  });
});
