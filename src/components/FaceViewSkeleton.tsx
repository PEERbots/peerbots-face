import { Skeleton } from "@peerbots/core";

export interface FaceViewSkeletonProps {
  label?: string;
}

export function FaceViewSkeleton({
  label = "Loading robot face",
}: FaceViewSkeletonProps = {}) {
  return (
    <div
      role="status"
      aria-label={label}
      data-testid="face-view-skeleton"
      className="pbf:flex pbf:flex-col pbf:items-center pbf:justify-center pbf:w-full pbf:h-full pbf:bg-sky-50 pbf:p-8 pbf:relative"
    >
      <div className="pbf:flex pbf:w-[80%] pbf:max-w-lg pbf:min-w-[260px] pbf:justify-around pbf:absolute pbf:top-1/3 pbf:px-12">
        <Skeleton className="pbf:w-16 pbf:h-16 pbf:md:w-24 pbf:md:h-24 pbf:rounded-full pbf:bg-slate-300" />
        <Skeleton className="pbf:w-16 pbf:h-16 pbf:md:w-24 pbf:md:h-24 pbf:rounded-full pbf:bg-slate-300" />
      </div>
      <div className="pbf:mt-48">
        <Skeleton className="pbf:w-24 pbf:h-6 pbf:md:w-32 pbf:md:h-12 pbf:rounded-full pbf:bg-slate-300" />
      </div>
    </div>
  );
}
