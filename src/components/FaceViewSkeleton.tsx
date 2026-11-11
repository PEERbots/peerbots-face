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
      className="flex flex-col items-center justify-center w-full h-full bg-sky-50 p-8 relative"
    >
      <div className="flex w-[80%] max-w-lg min-w-[260px] justify-around absolute top-1/3 px-12">
        <Skeleton className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-slate-300" />
        <Skeleton className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-slate-300" />
      </div>
      <div className="mt-48">
        <Skeleton className="w-24 h-6 md:w-32 md:h-12 rounded-full bg-slate-300" />
      </div>
    </div>
  );
}
