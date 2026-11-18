import { Heading, LineGraph } from "@peerbots/core";
import { useFaceStore } from "../store/FaceStoreContext";

export function AmplitudeGraph() {
  const amplitudeData = useFaceStore((state) => state.amplitudeData);
  const amplitudeExtrema = useFaceStore((state) => state.amplitudeExtrema);
  const isSpeaking = useFaceStore((state) => state.isSpeaking);
  const currentAmplitude = useFaceStore((state) => state.currentAmplitude);

  if (!isSpeaking && (!amplitudeData || amplitudeData.length === 0)) {
    return (
      <div className="p-4 text-gray-500 italic">
        No amplitude data available. Speak something to see data.
      </div>
    );
  }

  const hasData = Boolean(amplitudeData && amplitudeData.length > 0);
  const maxTime =
    hasData && amplitudeData
      ? amplitudeData[amplitudeData.length - 1].time
      : 1000;
  const height = 200;
  const padding = 20;

  return (
    <div className="m-4 p-4 bg-white shadow-xl rounded-lg border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <Heading level={3}>Audio Amplitude Visualization</Heading>
        <div className="flex gap-4 items-center">
          <div className="text-sm font-medium">
            Live:{" "}
            <span className="text-blue-600">
              {(currentAmplitude * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex-1 h-4 w-24 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-75"
              style={{ width: `${currentAmplitude * 100}%` }}
            />
          </div>
          {isSpeaking && (
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
            </span>
          )}
        </div>
      </div>

      <LineGraph
        data={amplitudeData?.map((p) => ({ x: p.time, y: p.value })) ?? []}
        highlightPoints={amplitudeExtrema?.map((p) => ({
          x: p.time,
          y: p.value,
          color: p.value > 0.1 ? "#ef4444" : "#10b981",
          label: `Time: ${p.time} ms, Value: ${p.value}`,
        }))}
        minX={0}
        maxX={maxTime}
        minY={0}
        maxY={1}
        height={height}
        strokeColor="#3b82f6"
        xUnit="ms"
        padding={padding}
      />

      <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
        <div>
          <span className="font-bold block mb-1">
            Local Extrema ({amplitudeExtrema?.length || 0})
          </span>
          <div className="max-h-32 overflow-y-auto bg-gray-50 p-2 rounded border border-gray-200">
            {amplitudeExtrema?.map((p, i) => (
              <div
                key={i}
                className="flex justify-between py-0.5 border-b border-gray-100 last:border-0"
              >
                <span>{p.time}ms</span>
                <span className="font-mono">{p.value.toFixed(4)}</span>
              </div>
            ))}
            {!amplitudeExtrema?.length && (
              <div className="text-slate-700 italic">No extrema found</div>
            )}
          </div>
        </div>
        <div>
          <span className="font-bold block mb-1">Stats</span>
          <div className="bg-gray-50 p-2 rounded border border-gray-200">
            <div className="flex justify-between">
              <span>Duration:</span>
              <span className="font-mono">{maxTime}ms</span>
            </div>
            <div className="flex justify-between">
              <span>Data Points:</span>
              <span className="font-mono">{amplitudeData?.length || 0}</span>
            </div>
            <div className="flex justify-between mt-1 pt-1 border-t border-gray-200">
              <span>Method:</span>
              <span className="text-blue-600 font-medium">
                {hasData
                  ? "Pre-calculated"
                  : currentAmplitude > 0
                    ? "Real-time/Simulated"
                    : "Idle"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AmplitudeGraph;
