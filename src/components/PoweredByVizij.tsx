import { faceCn as cn } from "../helpers/cn";
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
      className={cn("pbf:inline-flex pbf:flex-col pbf:items-center pbf:gap-0.5 pbf:group pbf:transition-all pbf:hover:opacity-100 pbf:opacity-90",
        className,
      )}
    >
      <span className="pbf:text-[9px] pbf:font-bold pbf:text-slate-600 pbf:uppercase pbf:tracking-[0.2em] pbf:leading-tight pbf:select-none">
        {poweredByLabel}
      </span>
      <div className="pbf:flex pbf:items-center pbf:gap-1.5 pbf:focus-visible:outline-none">
        <div className="pbf:relative pbf:w-5 pbf:h-5 pbf:group-hover:scale-110 pbf:transition-transform pbf:duration-300 pbf:ease-out">
          <img
            src={`${assetBaseUrl}/Vizij/brand.svg`}
            alt="Vizij Logo"
            className="pbf:w-full pbf:h-full pbf:object-contain"
          />
        </div>
        <span
          style={{
            fontFamily:
              "Gilroy, SFProRounded, ui-sans-serif, system-ui, sans-serif",
          }}
          className="pbf:text-lg pbf:font-bold pbf:tracking-tight pbf:text-teal-700"
        >
          vizij
        </span>
      </div>
    </a>
  );
}
