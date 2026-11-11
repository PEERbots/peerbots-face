import { Suspense, useEffect, useCallback } from "react";
import {
  useVizijRuntime,
  VizijRuntimeFace,
  VizijRuntimeProvider,
} from "@vizij/runtime-react";
import { useFaceStore } from "../store/FaceStoreContext";
import {
  pollyVisemeToVizijPath,
  possiblePollyVisemes,
  type PollyViseme,
} from "../helpers/viseme_mapper";
import { color_mapping, hexToRgb } from "../helpers/color_mappers";
import type { PeerbotsColor, PeerbotsEmotion } from "../types/face";
import { resolveFaceUiLabels, type FaceUiLabels } from "../types/labels";

function VizijFallback({ labels }: { labels: FaceUiLabels }) {
  const { loading, error, ready } = useVizijRuntime();
  return (
    <div className="flex items-center justify-center w-full h-full text-white bg-slate-900 p-4 text-sm">
      {(loading || !ready) && !error && <div>{labels.loading}</div>}
      {error && (
        <div>
          {labels.vizijErrorPrefix} {error.message}
        </div>
      )}
    </div>
  );
}

function VizijPoseSetter() {
  const { ready, animateValue, faceId, setInput } = useVizijRuntime();
  const settings = useFaceStore((state) => state.faceSettings);
  const lastMessage = useFaceStore((state) => state.lastMessage);
  const selectedFace = useFaceStore((state) => state.selectedFace);
  const spokenVisemes = useFaceStore((state) => state.spokenVisemes);

  const expressEmotion = useCallback(
    (emotion: PeerbotsEmotion) => {
      const expressivity = settings.vizijSettings?.faceExpressivity ?? 1;
      void animateValue(
        `rig/${faceId}/emotions/surprise.weight`,
        (emotion === "Surprised" ? 1 : 0) * expressivity,
        { duration: 0.2 },
      );
      void animateValue(
        `rig/${faceId}/emotions/happy.weight`,
        (emotion === "Happy" ? 1 : 0) * expressivity,
        { duration: 0.2 },
      );
      void animateValue(
        `rig/${faceId}/emotions/sad.weight`,
        (emotion === "Sad" ? 1 : 0) * expressivity,
        { duration: 0.2 },
      );
      void animateValue(
        `rig/${faceId}/emotions/concerned.weight`,
        (emotion === "Concerned" ? 1 : 0) * expressivity,
        { duration: 0.2 },
      );
      void animateValue(
        `rig/${faceId}/emotions/sleepy.weight`,
        (emotion === "Sleepy" ? 1 : 0) * expressivity,
        { duration: 0.2 },
      );
    },
    [animateValue, faceId, settings.vizijSettings?.faceExpressivity],
  );

  const expressColor = useCallback(
    (color: PeerbotsColor) => {
      const rgbColor = hexToRgb(color_mapping[color]) ?? {
        r: 0,
        g: 0,
        b: 0,
      };
      void animateValue(`rig/${faceId}/background/color/r`, rgbColor.r / 255, {
        duration: 0.2,
      });
      void animateValue(`rig/${faceId}/background/color/g`, rgbColor.g / 255, {
        duration: 0.2,
      });
      void animateValue(`rig/${faceId}/background/color/b`, rgbColor.b / 255, {
        duration: 0.2,
      });
    },
    [faceId, animateValue],
  );

  const expressViseme = useCallback(
    (viseme: PollyViseme, durationSec: number, prevViseme?: PollyViseme) => {
      const visemeVizijPath = pollyVisemeToVizijPath[viseme];
      const promises: Promise<void>[] = [];

      if (viseme === "sil") {
        possiblePollyVisemes.forEach((target) => {
          promises.push(
            animateValue(`rig/${faceId}/visemes/${target}.weight`, 0, {
              duration: durationSec,
            }) as Promise<void>,
          );
        });
      } else if (visemeVizijPath) {
        promises.push(
          animateValue(`rig/${faceId}/visemes/${visemeVizijPath}.weight`, 1, {
            duration: durationSec,
          }) as Promise<void>,
        );

        if (prevViseme) {
          const prevMappedViseme = pollyVisemeToVizijPath[prevViseme];
          if (prevMappedViseme && prevMappedViseme !== visemeVizijPath) {
            promises.push(
              animateValue(
                `rig/${faceId}/visemes/${prevMappedViseme}.weight`,
                0,
                { duration: durationSec },
              ) as Promise<void>,
            );
          }
        }
      }
      return Promise.all(promises);
    },
    [animateValue, faceId],
  );

  const expressTimedVisemes = useCallback(
    async (visemes: { value: string; time: number }[]) => {
      let prevViseme: PollyViseme | undefined;
      for (const viseme of visemes) {
        const visemeValue = viseme.value as PollyViseme;
        await expressViseme(visemeValue, viseme.time, prevViseme);
        prevViseme = visemeValue;
      }
    },
    [expressViseme],
  );

  useEffect(() => {
    if (ready) {
      expressColor(lastMessage.color);
      expressEmotion(lastMessage.emotion);
    }
  }, [
    ready,
    lastMessage.color,
    lastMessage.emotion,
    expressColor,
    expressEmotion,
  ]);

  useEffect(() => {
    if (ready && selectedFace?.kind === "Vizij") {
      setInput(`rig/${faceId}/scene/scale/x`, settings.zoom);
      setInput(`rig/${faceId}/scene/scale/y`, settings.zoom);
      setInput(
        `rig/${faceId}/scene/translation/x`,
        (settings.offset?.x ?? 0) / 620 - 1,
      );
      setInput(
        `rig/${faceId}/scene/translation/y`,
        (settings.offset?.y ?? 0) / 144 + 1,
      );
    }
  }, [ready, selectedFace?.kind, faceId, setInput, settings]);

  useEffect(() => {
    if (spokenVisemes !== null && ready) {
      void expressTimedVisemes(spokenVisemes);
    }
  }, [spokenVisemes, ready, expressTimedVisemes]);

  return null;
}

const ROTATION_CLASS: Record<0 | 90 | 180 | 270, string> = {
  0: "rotate-0 w-full h-full",
  90: "rotate-90 w-full h-full",
  180: "rotate-180 w-full h-full",
  270: "rotate-270 w-full h-full",
};

export interface VizijFaceViewProps {
  labels?: Partial<FaceUiLabels>;
}

export function VizijFaceView({ labels }: VizijFaceViewProps = {}) {
  const uiLabels = resolveFaceUiLabels(labels);
  const selectedFace = useFaceStore((state) => state.selectedFace);
  const settings = useFaceStore((state) => state.faceSettings);

  if (selectedFace?.kind !== "Vizij") {
    return null;
  }

  const normalizedRot = (((settings.rotation % 360) + 360) % 360) as
    | 0
    | 90
    | 180
    | 270;
  const rotClass = ROTATION_CLASS[normalizedRot] ?? ROTATION_CLASS[0];
  const glb = selectedFace.assetBundle?.glb;
  const hasGlbUrl =
    Boolean(glb) && "kind" in glb && glb.kind === "url" && Boolean(glb.src);

  return (
    <div className={rotClass} data-testid="vizij-face-view">
      {hasGlbUrl ? (
        <VizijRuntimeProvider assetBundle={selectedFace.assetBundle} autostart>
          <Suspense fallback={<VizijFallback labels={uiLabels} />}>
            <VizijRuntimeFace className="bg-black w-full h-full" />
            <VizijPoseSetter />
          </Suspense>
        </VizijRuntimeProvider>
      ) : (
        <div className="flex items-center justify-center h-full text-white bg-slate-900 p-4 text-sm">
          {uiLabels.vizijUploadGlb}
        </div>
      )}
    </div>
  );
}

export default VizijFaceView;
