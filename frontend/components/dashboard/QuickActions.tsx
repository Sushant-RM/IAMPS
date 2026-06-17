import Link from 'next/link';

export interface QuickAction {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
}

interface QuickActionsProps {
  title?: string;
  actions: QuickAction[];
}

const variantStyles = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700',
  ghost: 'bg-transparent hover:bg-slate-800/50 text-slate-300 border border-slate-700',
};

export default function QuickActions({ title = 'Quick Actions', actions }: QuickActionsProps) {
  return (
    <section className="bg-[#131b2e] border border-slate-800/60 rounded-[16px] p-6 shadow-sm">
      <h3 className="text-sm font-bold text-white uppercase tracking-tight mb-4">{title}</h3>
      <div className="flex flex-wrap gap-3">
        {actions.map((action) => {
          const className = `inline-flex items-center gap-2 px-4 py-3 rounded-[12px] text-xs font-bold uppercase tracking-wider transition-all ${variantStyles[action.variant || 'secondary']}`;

          if (action.href) {
            return (
              <Link key={action.label} href={action.href} className={className}>
                {action.icon && <span aria-hidden="true">{action.icon}</span>}
                {action.label}
              </Link>
            );
          }

          return (
            <button key={action.label} type="button" onClick={action.onClick} className={className}>
              {action.icon && <span aria-hidden="true">{action.icon}</span>}
              {action.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
