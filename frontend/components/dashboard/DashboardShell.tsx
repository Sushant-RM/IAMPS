import Navbar from '../Navbar';

import Toast from './Toast';

import DashboardSidebar from './DashboardSidebar';

import type { ToastState } from '../../lib/useToast';

import type { NavItem } from '../../lib/navigation';



interface DashboardShellProps {

  children: React.ReactNode;

  role: string;

  toast?: ToastState | null;

  showSidebar?: boolean;

  sidebarItems?: NavItem[];

  activeHref?: string;

}



export default function DashboardShell({

  children,

  role,

  toast = null,

  showSidebar = true,

  sidebarItems,

  activeHref,

}: DashboardShellProps) {

  return (
    <div className="min-h-screen h-screen bg-[#0b0f19] text-gray-200 flex flex-col overflow-hidden">
      <Navbar />
      <Toast toast={toast} />

      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-6 min-h-0 flex flex-col">
        <div className="flex gap-6 lg:gap-8 flex-1 min-h-0">
          {showSidebar && (
            <DashboardSidebar role={role} items={sidebarItems} activeHref={activeHref} />
          )}

          <main className="flex-1 min-w-0 min-h-0 overflow-y-auto overflow-x-hidden pr-1 custom-scrollbar">
            {children}
          </main>
        </div>
      </div>
    </div>
  );

}



export function DashboardSection({

  title,

  subtitle,

  action,

  children,

}: {

  title: string;

  subtitle?: string;

  action?: React.ReactNode;

  children: React.ReactNode;

}) {

  return (

    <section className="mb-8 sm:mb-10">

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4 sm:mb-6">

        <div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase italic">

            {title}

          </h2>

          {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}

        </div>

        {action}

      </div>

      {children}

    </section>

  );

}


