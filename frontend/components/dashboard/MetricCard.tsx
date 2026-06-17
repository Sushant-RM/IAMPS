import type { ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  description?: string;
  color?: string;
  loading?: boolean;
}

export default function MetricCard({
  label,
  value,
  description,
  color = 'text-blue-400',
  loading = false,
}: MetricCardProps) {
  return (
    <div className="bg-[#131b2e] border border-slate-800/60 p-6 rounded-[16px] shadow-sm">
      <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-2">
        {label}
      </p>
      {loading ? (
        <div className="h-9 w-16 bg-slate-800 rounded-[8px] animate-pulse mb-1" />
      ) : (
        <p className={`text-3xl font-black ${color}`}>{value}</p>
      )}
      {description && (
        <p className="text-[11px] text-slate-400 mt-1">{description}</p>
      )}
    </div>
  );
}

export function MetricCardGrid({
  children,
  columns = 4,
}: {
  children: ReactNode;
  columns?: 2 | 3 | 4 | 5;
}) {
  const colClass =
    columns === 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : columns === 3
        ? 'grid-cols-1 sm:grid-cols-3'
        : columns === 5
          ? 'grid-cols-2 md:grid-cols-5'
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

  return <div className={`grid ${colClass} gap-4 sm:gap-6 mb-8 sm:mb-10`}>{children}</div>;
}
