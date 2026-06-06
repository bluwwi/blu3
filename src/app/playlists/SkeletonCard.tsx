export function SkeletonCard() {
  return (
    <div className="flex flex-col gap-2 w-28 sm:w-32 md:w-36 lg:w-40 animate-pulse">
      <div className="aspect-square rounded-md bg-white/[0.04]" />
      <div className="h-3 w-3/4 rounded bg-white/[0.04] mt-1" />
    </div>
  );
}
