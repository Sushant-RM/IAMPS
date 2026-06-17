interface DashboardHeroProps {
  badge: string;
  badgeClass?: string;
  title: React.ReactNode;
  subtitle: string;
  actions?: React.ReactNode;
}

export default function DashboardHero({
  badge,
  badgeClass = 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  title,
  subtitle,
  actions,
}: DashboardHeroProps) {
  return (
    <div className="bg-gradient-to-br from-blue-900/60 to-indigo-950/80 border border-slate-800 rounded-[16px] p-8 sm:p-10 text-white shadow-2xl relative overflow-hidden mb-8 sm:mb-10">
      <div className="absolute top-0 right-0 w-72 sm:w-96 h-72 sm:h-96 bg-blue-600/10 rounded-full blur-3xl -mr-24 -mt-24" />
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <span
            className={`px-3 py-1 border rounded-full text-[10px] font-bold uppercase tracking-widest inline-block ${badgeClass}`}
          >
            {badge}
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mt-3 mb-2 leading-tight italic uppercase text-white">
            {title}
          </h1>
          <p className="text-sm sm:text-base text-slate-300 font-medium max-w-2xl">{subtitle}</p>
        </div>
        {actions && <div className="flex flex-wrap gap-3 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
