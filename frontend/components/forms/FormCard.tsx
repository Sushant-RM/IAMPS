import type { ReactNode } from 'react';

interface FormCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  backHref?: string;
  backLabel?: string;
}

export default function FormCard({ title, subtitle, children, backHref, backLabel }: FormCardProps) {
  return (
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {backHref && (
          <a
            href={backHref}
            className="inline-flex items-center gap-2 mb-6 text-slate-400 hover:text-white text-sm font-semibold transition-colors"
          >
            ← {backLabel || 'Back'}
          </a>
        )}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white tracking-tight italic uppercase">{title}</h1>
          {subtitle && <p className="text-slate-400 mt-2 text-sm font-medium">{subtitle}</p>}
        </div>
        <div className="bg-[#131b2e] border border-slate-800 rounded-[16px] p-6 sm:p-8 shadow-2xl">
          {children}
        </div>
      </div>
    </div>
  );
}

export function FormPage({ title, subtitle, children, action }: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0b0f19] pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 sm:pt-36">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight italic uppercase">{title}</h1>
            {subtitle && <p className="text-slate-400 mt-2 text-sm">{subtitle}</p>}
          </div>
          {action}
        </div>
        <div className="bg-[#131b2e] border border-slate-800 rounded-[16px] p-6 sm:p-8 shadow-xl">
          {children}
        </div>
      </div>
    </div>
  );
}
