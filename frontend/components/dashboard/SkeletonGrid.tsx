export function SkeletonCard({ height = 'h-32' }: { height?: string }) {
  return (
    <div
      className={`bg-[#131b2e] border border-slate-800/60 rounded-[16px] animate-pulse ${height}`}
    />
  );
}

export function SkeletonMetricGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} height="h-28" />
      ))}
    </div>
  );
}

export function SkeletonChartGrid({ count = 2 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-1 ${count > 1 ? 'lg:grid-cols-2' : ''} gap-6 mb-8`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} height="h-72" />
      ))}
    </div>
  );
}

export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-20 bg-[#131b2e] border border-slate-800/60 rounded-[12px] animate-pulse"
        />
      ))}
    </div>
  );
}

export function SkeletonHero() {
  return (
    <div className="bg-[#131b2e] border border-slate-800 rounded-[16px] p-10 mb-8 animate-pulse">
      <div className="h-4 w-24 bg-slate-800 rounded-full mb-4" />
      <div className="h-10 w-2/3 max-w-md bg-slate-800 rounded-[8px] mb-3" />
      <div className="h-4 w-full max-w-xl bg-slate-800/70 rounded-[8px]" />
    </div>
  );
}
