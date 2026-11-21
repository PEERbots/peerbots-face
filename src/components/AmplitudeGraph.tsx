import { Heading, LineGraph } from "@peerbots/core";
import { useFaceStore } from "../store/FaceStoreContext";

export function AmplitudeGraph() {
  const amplitudeData = useFaceStore((state) => state.amplitudeData);
  const amplitudeExtrema = useFaceStore((state) => state.amplitudeExtrema);
  const isSpeaking = useFaceStore((state) => state.isSpeaking);
  const currentAmplitude = useFaceStore((state) => state.currentAmplitude);

  if (!isSpeaking && (!amplitudeData || amplitudeData.length === 0)) {
    return (
      <div className="pbf:p-4 pbf:text-gray-500 pbf:italic">
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
    <div className="pbf:m-4 pbf:p-4 pbf:bg-white pbf:shadow-xl pbf:rounded-lg pbf:border pbf:border-gray-100">
      <div className="pbf:flex pbf:items-center pbf:justify-between pbf:mb-2">
        <Heading level={3}>Audio Amplitude Visualization</Heading>
        <div className="pbf:flex pbf:gap-4 pbf:items-center">
          <div className="pbf:text-sm pbf:font-medium">
            Live:{" "}
            <span className="pbf:text-blue-600">
              {(currentAmplitude * 100).toFixed(1)}%
            </span>
          </div>
          <div className="pbf:flex-1 pbf:h-4 pbf:w-24 pbf:bg-gray-200 pbf:rounded-full pbf:overflow-hidden">
            <div
              className="pbf:h-full pbf:bg-blue-500 pbf:transition-all pbf:duration-75"
              style={{ width: `${currentAmplitude * 100}%` }}
            />
          </div>
          {isSpeaking && (
            <span className="pbf:flex pbf:h-3 pbf:w-3 pbf:relative">
              <span className="pbf:animate-ping pbf:absolute pbf:inline-flex pbf:h-full pbf:w-full pbf:rounded-full pbf:bg-green-400 pbf:opacity-75" />
              <span className="pbf:relative pbf:inline-flex pbf:rounded-full pbf:h-3 pbf:w-3 pbf:bg-green-500" />
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

      <div className="pbf:mt-4 pbf:grid pbf:grid-cols-2 pbf:gap-4 pbf:text-xs">
        <div>
          <span className="pbf:font-bold pbf:block pbf:mb-1">
            Local Extrema ({amplitudeExtrema?.length || 0})
          </span>
          <div className="pbf:max-h-32 pbf:overflow-y-auto pbf:bg-gray-50 pbf:p-2 pbf:rounded pbf:border pbf:border-gray-200">
            {amplitudeExtrema?.map((p, i) => (
              <div
                key={i}
                className="pbf:flex pbf:justify-between pbf:py-0.5 pbf:border-b pbf:border-gray-100 pbf:last:border-0"
              >
                <span>{p.time}ms</span>
                <span className="pbf:font-mono">{p.value.toFixed(4)}</span>
              </div>
            ))}
            {!amplitudeExtrema?.length && (
              <div className="pbf:text-slate-700 pbf:italic">No extrema found</div>
            )}
          </div>
        </div>
        <div>
          <span className="pbf:font-bold pbf:block pbf:mb-1">Stats</span>
          <div className="pbf:bg-gray-50 pbf:p-2 pbf:rounded pbf:border pbf:border-gray-200">
            <div className="pbf:flex pbf:justify-between">
              <span>Duration:</span>
              <span className="pbf:font-mono">{maxTime}ms</span>
            </div>
            <div className="pbf:flex pbf:justify-between">
              <span>Data Points:</span>
              <span className="pbf:font-mono">{amplitudeData?.length || 0}</span>
            </div>
            <div className="pbf:flex pbf:justify-between pbf:mt-1 pbf:pt-1 pbf:border-t pbf:border-gray-200">
              <span>Method:</span>
              <span className="pbf:text-blue-600 pbf:font-medium">
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
