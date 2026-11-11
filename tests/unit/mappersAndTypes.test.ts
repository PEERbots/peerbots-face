import { describe, expect, it } from "vitest";
import {
  EMOTION_EMOJIS,
  EMOTION_EMOTICONS,
  PEERBOTS_COLORS,
  PEERBOTS_EMOTIONS,
  FaceRendererRegistry,
  availableFaces,
  builtInFaces,
  color_mapping,
  createBuiltInFaces,
  deconstructRgba,
  emotion_mapping,
  estimateVisemesFromText,
  findMatchingVoice,
  font_color_mapping,
  formatRbga,
  formatRgba,
  formatVoiceDisplayName,
  getEmotionEyeSpritePaths,
  getEmotionIconPath,
  getFaceCapabilities,
  getLanguageName,
  hexToRgb,
  hexToRgba,
  interpolateColor,
  isHeadlessOrTestEnvironment,
  isWebGLAvailable,
  mapVisemeToVizijTarget,
  normalizeAssetBaseUrl,
  pollyVisemeToVizijPath,
  possiblePollyVisemes,
  rbgToRgba,
   resolveFaceUiLabels,
  rgbToRgba,
  rgbaToHex,
} from "../../src";

describe("viseme_mapper", () => {
  it("maps Polly visemes to Vizij rig paths", () => {
    expect(pollyVisemeToVizijPath["@"]).toBe("pose_pzzzfnvy");
    expect(pollyVisemeToVizijPath.sil).toBe("");
    expect(mapVisemeToVizijTarget("a")).toBe("a");
    expect(mapVisemeToVizijTarget("O")).toBe("o_2");
    expect(mapVisemeToVizijTarget("unknown")).toBe("");
    expect(possiblePollyVisemes).toContain("pose_pzzzfnvy");
    expect(possiblePollyVisemes).not.toContain("");
  });

  it("estimates timed visemes from plain text and coalesces duplicates", () => {
    expect(estimateVisemesFromText("   ")).toEqual([]);
    const result = estimateVisemesFromText("baa!", 100);
    expect(result.length).toBeGreaterThanOrEqual(3);
    expect(result[0]).toEqual({ time: 0.1, type: "viseme", value: "p" });
    expect(result[1]).toEqual({ time: 0.2, type: "viseme", value: "a" });
    expect(result[result.length - 1].value).toBe("sil");
  });
});

describe("emotion_mapper & color_mappers", () => {
  it("maps all canonical Peerbots emotions to icons, eye sprites, emoticons, and emojis", () => {
    for (const emotion of PEERBOTS_EMOTIONS) {
      expect(EMOTION_EMOTICONS[emotion]).toBeTruthy();
      expect(EMOTION_EMOJIS[emotion]).toBeTruthy();
      expect(emotion_mapping[emotion]).toContain("/FaceAssets/Icons/");
      const sprites = getEmotionEyeSpritePaths(emotion, "Hugo", "/custom/");
      expect(sprites.left).toBe(`/custom/Hugo/${emotion.toLowerCase()}_l.png`);
      expect(sprites.right).toBe(`/custom/Hugo/${emotion.toLowerCase()}_r.png`);
    }
    expect(getEmotionIconPath("Sleepy", "/assets/")).toBe("/assets/Icons/Sleep.png");
  });

  it("converts and interpolates canonical Peerbots colors accurately", () => {
    for (const color of PEERBOTS_COLORS) {
      expect(color_mapping[color]).toMatch(/^#[0-9A-F]{6}$/i);
      expect(font_color_mapping[color]).toMatch(/^#[0-9A-F]{6}$/i);
    }

    expect(hexToRgb("#03f")).toEqual({ r: 0, g: 51, b: 255 });
    expect(hexToRgb("#ABE3FA")).toEqual({ r: 171, g: 227, b: 250 });
    expect(hexToRgb("not-a-hex")).toBeNull();

    expect(hexToRgba("#000000", 0.5)).toBe("rgba(0,0,0,0.5)");
    expect(hexToRgba("invalid")).toBeNull();

    expect(rgbaToHex("rgba(255, 0, 128, 1)")).toBe("ff0080ff");
    expect(rgbaToHex("rgb(0, 255, 0)")).toBe("00ff00ff");
    expect(rgbaToHex("plain")).toBe("plain");

    expect(rgbToRgba("rgb(10, 20, 30)", 0.8)).toBe("rgba(10,20,30,0.8)");
    expect(rbgToRgba("rgb(10, 20, 30)")).toBe("rgba(10,20,30,1)");
    expect(deconstructRgba("rgba(10, 20, 30, 1)")).toEqual([10, 20, 30, 1]);
    expect(formatRgba({ r: 1, g: 2, b: 3, a: 1 })).toBe("rgba(1,2,3,1)");
    expect(formatRbga({ r: 1, g: 2, b: 3, a: 1 })).toBe("rgba(1,2,3,1)");

    expect(interpolateColor("#000000", "#ffffff", 0.5)).toBe("rgba(128,128,128,1)");
    expect(interpolateColor("not-a-color", "#ffffff", 0.5)).toBeNull();
  });
});

describe("voice_helpers", () => {
  it("formats technical voice names into clean display labels", () => {
    expect(formatVoiceDisplayName("")).toBe("");
    expect(formatVoiceDisplayName("AWS - Joanna")).toBe("Joanna");
    expect(formatVoiceDisplayName("aws:Matthew:neural")).toBe("Matthew");
    expect(formatVoiceDisplayName("com.apple.speech.synthesis.voice.Alex")).toBe("Alex");
    expect(formatVoiceDisplayName("com.apple.voice.compact.en-US.Samantha")).toBe("Samantha");
    expect(formatVoiceDisplayName("com.apple.voice.enhanced.en-US.Samantha")).toBe(
      "Samantha (Enhanced)",
    );
    expect(
      formatVoiceDisplayName("com.apple.ttsbundle.siri_female_en-US_compact"),
    ).toBe("Siri Female");
    expect(
      formatVoiceDisplayName("com.apple.ttsbundle.siri_male_en-US_premium"),
    ).toBe("Siri Male (Premium)");
    expect(
      formatVoiceDisplayName("com.apple.ttsbundle.Samantha-enhanced"),
    ).toBe("Samantha (Enhanced)");
    expect(formatVoiceDisplayName("com.apple.eloquence.en-US.Flo")).toBe("Flo");
    expect(formatVoiceDisplayName("com.apple.custom.MyVoice_compact")).toBe("My Voice");
    expect(
      formatVoiceDisplayName("com.google.android.tts:en-us-x-sfg-local"),
    ).toBe("en us x sfg local");
  });

  it("resolves language names and matches voices flexibly", () => {
    expect(getLanguageName("")).toBe("");
    expect(getLanguageName("en-US")).toBe("English");
    expect(getLanguageName("ar-EG")).toBe("Arabic");

    const voices = [
      {
        name: "com.apple.voice.compact.en-US.Samantha",
        voiceURI: "urn:samantha",
        lang: "en-US",
      },
      {
        name: "AWS - Joanna",
        voiceURI: "aws:Joanna:neural",
        lang: "en-US",
      },
    ];

    expect(findMatchingVoice(voices, null)).toBeUndefined();
    expect(findMatchingVoice(voices, "urn:samantha")).toBe(voices[0]);
    expect(findMatchingVoice(voices, "Samantha")).toBe(voices[0]);
    expect(findMatchingVoice(voices, "AWS:JOANNA:NEURAL")).toBe(voices[1]);
  });
});

describe("face definitions, capabilities, renderer registry & environment", () => {
  it("normalizes asset base URLs and builds built-in faces", () => {
    expect(normalizeAssetBaseUrl()).toBe("/FaceAssets");
    expect(normalizeAssetBaseUrl("   ")).toBe("/FaceAssets");
    expect(normalizeAssetBaseUrl("/cdn/faces/")).toBe("/cdn/faces");

    const customBuiltIns = createBuiltInFaces("/cdn/faces/");
    expect(customBuiltIns).toHaveLength(availableFaces.length);
    const hugo = customBuiltIns[0];
    expect(hugo.kind).toBe("PixiFace");
    if (hugo.kind === "PixiFace" && hugo.type === "avatar") {
      expect(hugo.eyes.path).toBe("/cdn/faces/Hugo/hugo_spritesheet.json");
    }
  });

  it("reports accurate capabilities for each canonical face kind", () => {
    expect(getFaceCapabilities(undefined)).toEqual({
      canExpressColor: false,
      canExpressEmotion: false,
      canLipSync: false,
    });
    expect(getFaceCapabilities(builtInFaces[0]).canLipSync).toBe(
      "Timed mouth motions",
    );
    expect(getFaceCapabilities(builtInFaces[2]).canLipSync).toBe(
      "Random mouth motions",
    );
    expect(getFaceCapabilities(builtInFaces[3]).canLipSync).toBe(
      "Cursor movement",
    );
    expect(
      getFaceCapabilities({
        kind: "PixiFace",
        type: "text",
        name: "Plain",
        showEmotion: "none",
        showText: true,
      } as (typeof builtInFaces)[3]).canExpressEmotion,
    ).toBe(false);
    expect(getFaceCapabilities(availableFaces[4]).canExpressEmotion).toBe(
      "Animated Expression",
    );
    expect(getFaceCapabilities({ kind: "Unknown", name: "Mystery" })).toEqual({
      canExpressColor: false,
      canExpressEmotion: false,
      canLipSync: false,
    });
  });

  it("registers, queries, and unregisters FaceRendererStrategy implementations", () => {
    const registry = new FaceRendererRegistry();
    registry.register({
      kind: "Custom2D",
      displayName: "Custom 2D",
      requiresWebGL: false,
      getCapabilities: () => ({
        canExpressColor: true,
        canExpressEmotion: true,
        canLipSync: false,
      }),
      render: () => "custom-node",
    });

    expect(registry.has("Custom2D")).toBe(true);
    expect(registry.list()).toHaveLength(1);
    expect(
      registry.getCapabilities({ kind: "Custom2D", name: "Bot" }).canExpressColor,
    ).toBe(true);
    expect(registry.getCapabilities(undefined).canExpressColor).toBe(false);
    expect(registry.unregister("Custom2D")).toBe(true);
    expect(registry.has("Custom2D")).toBe(false);
  });

  it("detects jsdom/headless test environment and merges UI labels", () => {
    expect(isWebGLAvailable()).toBe(false);
    expect(isHeadlessOrTestEnvironment()).toBe(true);
    expect(resolveFaceUiLabels({ zoom: "Scale" }).zoom).toBe("Scale");
  });
});
