import { Suspense, useEffect, useCallback, useRef, useState } from "react";
import { VizijCanvas } from "@vizij/render";
import {
  useAnimateValue,
  useVizijRuntime,
  VizijRuntimeFace,
  VizijRuntimeProvider,
} from "@vizij/runtime-react";
import { useFaceStore } from "../store/FaceStoreContext";
import {
  mapVisemeToStandardViseme,
  pollyVisemeToVizijPath,
  possiblePollyVisemes,
  type PollyViseme,
} from "../helpers/viseme_mapper";
import { color_mapping, hexToRgb } from "../helpers/color_mappers";
import { resolveVizijGlbSource } from "../types/face";
import {
  PEERBOTS_PROFILE_KEYS,
  VIZIJ_STANDARD_KEYS,
  VIZIJ_STANDARD_VISEMES,
  buildProfileControlValues,
  inspectGlbProfileConnection,
} from "../types/profile";
import { resolveFaceUiLabels, type FaceUiLabels } from "../types/labels";

function VizijFallback({ labels }: { labels: FaceUiLabels }) {
  const { status, error } = useVizijRuntime();
  return (
    <div className="pbf:flex pbf:items-center pbf:justify-center pbf:w-full pbf:h-full pbf:text-white pbf:bg-slate-900 pbf:p-4 pbf:text-sm">
      {status === "loading" && !error && <div>{labels.loading}</div>}
      {error && (
        <div>
          {labels.vizijErrorPrefix} {error.message}
        </div>
      )}
    </div>
  );
}

const ANIMATED_KEY_PREFIXES = [
  "peerbots/expression/",
  "standard/vizij/expression/",
  "peerbots/color/",
  "background/color/",
  "peerbots/gaze/",
  "standard/vizij/gaze/",
  "standard/vizij/left_eye/",
  "standard/vizij/right_eye/",
  "standard/vizij/face/",
];

function shouldAnimateKey(relativePath: string): boolean {
  return ANIMATED_KEY_PREFIXES.some((prefix) =>
    relativePath.startsWith(prefix),
  );
}

function VizijPoseSetter() {
  const { runtime, status, description } = useVizijRuntime();
  const { animateValue } = useAnimateValue();

  const settings = useFaceStore((state) => state.faceSettings);
  const lastMessage = useFaceStore((state) => state.lastMessage);
  const selectedFace = useFaceStore((state) => state.selectedFace);
  const gaze = useFaceStore((state) => state.gaze);
  const blinkNonce = useFaceStore((state) => state.blinkNonce);
  const extendedExpression = useFaceStore((state) => state.extendedExpression);
  const facsOverrides = useFaceStore((state) => state.facsOverrides);
  const isSpeaking = useFaceStore((state) => state.isSpeaking);
  const currentAmplitude = useFaceStore((state) => state.currentAmplitude);
  const spokenVisemes = useFaceStore((state) => state.spokenVisemes);
  const setVizijConnectionReport = useFaceStore(
    (state) => state.setVizijConnectionReport,
  );

  const [availableKeys, setAvailableKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const prevBlinkNonceRef = useRef(blinkNonce);
  const isReady = status === "ready" && runtime !== null;

  // Inspect loaded GLB keys once ready and report auto-connection status to the store
  useEffect(() => {
    if (!isReady || !runtime) return;
    let cancelled = false;

    async function inspectKeys() {
      if (!runtime) return;
      try {
        const listed = await runtime.listKeys();
        if (cancelled) return;
        const paths = listed.map((k) => k.path);
        const keySet = new Set(paths);
        setAvailableKeys(keySet);

        const declaredProfiles = Array.isArray(description?.metadata?.profiles)
          ? (description.metadata.profiles as string[])
          : [];
        const report = inspectGlbProfileConnection(paths, declaredProfiles);
        setVizijConnectionReport(report);
      } catch (err) {
        console.warn("Failed to inspect Vizij runtime keys:", err);
      }
    }

    void inspectKeys();
    return () => {
      cancelled = true;
    };
  }, [isReady, runtime, description, setVizijConnectionReport]);

  // Helper to resolve a relative key path if present in the loaded Vizij device
  const resolveBoundPath = useCallback(
    (relativePath: string): string | null => {
      if (!runtime) return null;
      const prefixed = runtime.path(relativePath);
      if (availableKeys.has(prefixed)) return prefixed;
      if (availableKeys.has(relativePath)) return relativePath;
      return null;
    },
    [runtime, availableKeys],
  );

  // Apply unified peerbots-face + vizij-face + legacy fallback controls
  useEffect(() => {
    if (!isReady || !runtime || availableKeys.size === 0) return;

    const controlValues = buildProfileControlValues({
      message: lastMessage,
      gaze,
      settings,
      isSpeaking,
      currentAmplitude,
      extendedExpression,
      facsOverrides,
    });

    for (const [relativePath, value] of Object.entries(controlValues)) {
      const targetPath = resolveBoundPath(relativePath);
      if (!targetPath) continue;
      if (shouldAnimateKey(relativePath)) {
        void animateValue(targetPath, value, { duration: 0.22 }).catch(
          () => undefined,
        );
      } else {
        void runtime.setValue(targetPath, value);
      }
    }

    // Legacy pre-1.0 fallback keys (emotions/*.weight, background/color/*, scene/*)
    const expressivity = settings.vizijSettings?.faceExpressivity ?? 1;
    const legacyEmotions: Record<string, boolean> = {
      surprise: lastMessage.emotion === "Surprised",
      happy: lastMessage.emotion === "Happy",
      sad: lastMessage.emotion === "Sad",
      concerned: lastMessage.emotion === "Concerned",
      sleepy: lastMessage.emotion === "Sleepy",
    };
    for (const [key, active] of Object.entries(legacyEmotions)) {
      const legacyPath = resolveBoundPath(`emotions/${key}.weight`);
      if (legacyPath) {
        void animateValue(legacyPath, (active ? 1 : 0) * expressivity, {
          duration: 0.2,
        }).catch(() => undefined);
      }
    }

    const rgb = hexToRgb(
      color_mapping[lastMessage.color] ?? color_mapping["Light Blue"],
    ) ?? { r: 171, g: 227, b: 250 };
    const legacyColorMap: Record<string, number> = {
      "background/color/r": rgb.r / 255,
      "background/color/g": rgb.g / 255,
      "background/color/b": rgb.b / 255,
    };
    for (const [rel, val] of Object.entries(legacyColorMap)) {
      const legacyPath = resolveBoundPath(rel);
      if (legacyPath) {
        void animateValue(legacyPath, val, { duration: 0.2 }).catch(
          () => undefined,
        );
      }
    }

    if (selectedFace?.kind === "Vizij") {
      const legacyScaleX = resolveBoundPath("scene/scale/x");
      const legacyScaleY = resolveBoundPath("scene/scale/y");
      const legacyTransX = resolveBoundPath("scene/translation/x");
      const legacyTransY = resolveBoundPath("scene/translation/y");
      if (legacyScaleX) void runtime.setValue(legacyScaleX, settings.zoom);
      if (legacyScaleY) void runtime.setValue(legacyScaleY, settings.zoom);
      if (legacyTransX) {
        void runtime.setValue(legacyTransX, (settings.offset?.x ?? 0) / 620 - 1);
      }
      if (legacyTransY) {
        void runtime.setValue(legacyTransY, (settings.offset?.y ?? 0) / 144 + 1);
      }
    }
  }, [
    isReady,
    runtime,
    availableKeys,
    lastMessage,
    gaze,
    settings,
    isSpeaking,
    currentAmplitude,
    extendedExpression,
    facsOverrides,
    selectedFace?.kind,
    resolveBoundPath,
    animateValue,
  ]);

  // Smooth ~200ms blink envelope on triggerBlink()
  useEffect(() => {
    if (blinkNonce === prevBlinkNonceRef.current) return;
    prevBlinkNonceRef.current = blinkNonce;
    if (!isReady || !runtime) return;

    const blinkPaths = [
      resolveBoundPath(PEERBOTS_PROFILE_KEYS.blink),
      resolveBoundPath(VIZIJ_STANDARD_KEYS.blink),
    ].filter((p): p is string => p !== null);

    if (blinkPaths.length === 0) return;

    void Promise.all(
      blinkPaths.map(async (path) => {
        await animateValue(path, 1, { duration: 0.08, easing: "easeIn" }).catch(
          () => undefined,
        );
        await animateValue(path, 0, { duration: 0.12, easing: "easeOut" }).catch(
          () => undefined,
        );
      }),
    );
  }, [blinkNonce, isReady, runtime, resolveBoundPath, animateValue]);

  // Timed viseme playback (supports both Vizij 1.0 15-viseme standard and legacy visemes/*)
  const expressViseme = useCallback(
    (viseme: PollyViseme, durationSec: number, prevViseme?: PollyViseme) => {
      const promises: Promise<void>[] = [];
      const standardShape = mapVisemeToStandardViseme(viseme);
      const hasStandardVisemes =
        resolveBoundPath(VIZIJ_STANDARD_KEYS.viseme("aa")) !== null;

      if (hasStandardVisemes) {
        if (viseme === "sil") {
          for (const shape of VIZIJ_STANDARD_VISEMES) {
            if (shape === "sil") continue;
            const path = resolveBoundPath(VIZIJ_STANDARD_KEYS.viseme(shape));
            if (path) {
              promises.push(
                animateValue(path, 0, { duration: durationSec }).catch(
                  () => undefined,
                ),
              );
            }
          }
        } else {
          const path = resolveBoundPath(
            VIZIJ_STANDARD_KEYS.viseme(standardShape),
          );
          if (path) {
            promises.push(
              animateValue(path, 1, { duration: durationSec }).catch(
                () => undefined,
              ),
            );
          }
          if (prevViseme) {
            const prevShape = mapVisemeToStandardViseme(prevViseme);
            if (prevShape !== standardShape && prevShape !== "sil") {
              const prevPath = resolveBoundPath(
                VIZIJ_STANDARD_KEYS.viseme(prevShape),
              );
              if (prevPath) {
                promises.push(
                  animateValue(prevPath, 0, { duration: durationSec }).catch(
                    () => undefined,
                  ),
                );
              }
            }
          }
        }
        return Promise.all(promises);
      }

      // Legacy pre-1.0 visemes/<target>.weight fallback
      const visemeVizijPath = pollyVisemeToVizijPath[viseme];
      if (viseme === "sil") {
        possiblePollyVisemes.forEach((target) => {
          const path = resolveBoundPath(`visemes/${target}.weight`);
          if (path) {
            promises.push(
              animateValue(path, 0, { duration: durationSec }).catch(
                () => undefined,
              ),
            );
          }
        });
      } else if (visemeVizijPath) {
        const path = resolveBoundPath(`visemes/${visemeVizijPath}.weight`);
        if (path) {
          promises.push(
            animateValue(path, 1, { duration: durationSec }).catch(
              () => undefined,
            ),
          );
        }
        if (prevViseme) {
          const prevMapped = pollyVisemeToVizijPath[prevViseme];
          if (prevMapped && prevMapped !== visemeVizijPath) {
            const prevPath = resolveBoundPath(`visemes/${prevMapped}.weight`);
            if (prevPath) {
              promises.push(
                animateValue(prevPath, 0, { duration: durationSec }).catch(
                  () => undefined,
                ),
              );
            }
          }
        }
      }
      return Promise.all(promises);
    },
    [animateValue, resolveBoundPath],
  );

  useEffect(() => {
    if (!spokenVisemes || !isReady || availableKeys.size === 0) return;
    let cancelled = false;
    async function runVisemes() {
      if (!spokenVisemes) return;
      let prevViseme: PollyViseme | undefined;
      for (const viseme of spokenVisemes) {
        if (cancelled) return;
        const val = viseme.value as PollyViseme;
        await expressViseme(val, viseme.time, prevViseme);
        prevViseme = val;
      }
    }
    void runVisemes();
    return () => {
      cancelled = true;
    };
  }, [spokenVisemes, isReady, availableKeys, expressViseme]);

  return null;
}

export interface VizijFaceViewProps {
  labels?: Partial<FaceUiLabels>;
}

export function VizijFaceView({ labels }: VizijFaceViewProps = {}) {
  const uiLabels = resolveFaceUiLabels(labels);
  const selectedFace = useFaceStore((state) => state.selectedFace);
  const settings = useFaceStore((state) => state.faceSettings);
  const lastMessage = useFaceStore((state) => state.lastMessage);
  const connectionReport = useFaceStore((state) => state.vizijConnectionReport);

  if (selectedFace?.kind !== "Vizij") {
    return null;
  }

  const glbSource = resolveVizijGlbSource(selectedFace);
  const backdropColor =
    connectionReport && !connectionReport.color
      ? (color_mapping[lastMessage.color] ?? color_mapping["Light Blue"])
      : undefined;

  const hasRigScale = Boolean(connectionReport?.sceneTransform.scale);
  const slotZoom = hasRigScale ? 1 : settings.zoom;

  return (
    <div
      className="pbf:w-full pbf:h-full pbf:relative pbf:overflow-hidden"
      style={backdropColor ? { backgroundColor: backdropColor } : undefined}
      data-testid="vizij-face-view"
    >
      {glbSource ? (
        <>
          <VizijCanvas />
          <VizijRuntimeProvider glb={glbSource}>
            <Suspense fallback={<VizijFallback labels={uiLabels} />}>
              <VizijRuntimeFace
                className="pbf:w-full pbf:h-full"
                fit="contain"
                zoom={slotZoom}
              />
              <VizijPoseSetter />
            </Suspense>
          </VizijRuntimeProvider>
        </>
      ) : (
        <div className="pbf:flex pbf:items-center pbf:justify-center pbf:h-full pbf:text-white pbf:bg-slate-900 pbf:p-4 pbf:text-sm">
          {uiLabels.vizijUploadGlb}
        </div>
      )}
    </div>
  );
}

export default VizijFaceView;
