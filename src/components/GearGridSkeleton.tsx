export function GearGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-xl border border-border bg-card"
        >
          <div className="aspect-[4/3] animate-shimmer" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-2/3 animate-shimmer rounded-md" />
            <div className="h-3 w-full animate-shimmer rounded-md" />
            <div className="h-3 w-4/5 animate-shimmer rounded-md" />
            <div className="flex justify-between pt-2">
              <div className="h-6 w-20 animate-shimmer rounded-md" />
              <div className="h-5 w-12 animate-shimmer rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default GearGridSkeleton;
