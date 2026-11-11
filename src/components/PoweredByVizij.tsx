import { cn } from "@peerbots/core";
import { useFaceStore } from "../store/FaceStoreContext";
import { DEFAULT_FACE_UI_LABELS } from "../types/labels";

export interface PoweredByVizijProps {
  className?: string;
  poweredByLabel?: string;
}

export function PoweredByVizij({
  className,
  poweredByLabel = DEFAULT_FACE_UI_LABELS.poweredBy,
}: PoweredByVizijProps) {
  const assetBaseUrl = useFaceStore((state) => state.assetBaseUrl);

  return (
    <a
      href="https://vizij.ai"
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex flex-col items-center gap-0.5 group transition-all hover:opacity-100 opacity-90",
        className,
      )}
    >
      <span className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em] leading-tight select-none">
        {poweredByLabel}
      </span>
      <div className="flex items-center gap-1.5 focus-visible:outline-none">
        <div className="relative w-5 h-5 group-hover:scale-110 transition-transform duration-300 ease-out">
          <img
            src={`${assetBaseUrl}/Vizij/brand.svg`}
            alt="Vizij Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <span
          style={{
            fontFamily:
              "Gilroy, SFProRounded, ui-sans-serif, system-ui, sans-serif",
          }}
          className="text-lg font-bold tracking-tight text-teal-700"
        >
          vizij
        </span>
      </div>
    </a>
  );
}
