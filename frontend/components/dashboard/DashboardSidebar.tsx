'use client';



import Link from 'next/link';

import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import { getRoleNavigation, type NavItem } from '../../lib/navigation';



interface DashboardSidebarProps {

  role: string;

  items?: NavItem[];

  activeHref?: string;

}



function isNavActive(currentPath: string, itemHref: string, pathname: string) {

  if (currentPath === itemHref) return true;

  if (itemHref.includes('?')) {

    const [base, query] = itemHref.split('?');

    return pathname === base && currentPath.includes(query);

  }

  return pathname === itemHref;

}



export default function DashboardSidebar({ role, items, activeHref }: DashboardSidebarProps) {

  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = items || getRoleNavigation(role);

  const currentPath = activeHref || router.asPath;



  useEffect(() => {

    setMobileOpen(false);

  }, [router.asPath]);



  const navContent = (

    <nav className="space-y-1.5" aria-label="Dashboard navigation">

      <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] px-2 mb-3">

        Navigation

      </p>

      {navItems.map((item) => {

        const isActive = isNavActive(currentPath, item.href, router.pathname);

        return (

          <Link

            key={`${item.href}-${item.label}`}

            href={item.href}

            onClick={() => setMobileOpen(false)}

            className={`flex items-center justify-between gap-3 px-4 py-3 rounded-[12px] text-sm font-semibold transition-all ${

              isActive

                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'

                : 'bg-[#131b2e] hover:bg-slate-800/50 text-slate-400 hover:text-white border border-slate-800/40'

            }`}

          >

            <span className="flex items-center gap-3 min-w-0">

              <span aria-hidden="true" className="shrink-0">{item.icon}</span>

              <span className="truncate">{item.label}</span>

            </span>

            {item.badge != null && item.badge > 0 && (

              <span className="px-2 py-0.5 text-xs bg-red-500 text-white font-bold rounded-full shrink-0">

                {item.badge}

              </span>

            )}

          </Link>

        );

      })}

    </nav>

  );



  return (

    <>

      <button

        type="button"

        className="lg:hidden mb-4 w-full flex items-center justify-between px-4 py-3 rounded-[12px] bg-[#131b2e] border border-slate-800 text-sm font-semibold text-white"

        onClick={() => setMobileOpen((open) => !open)}

        aria-expanded={mobileOpen}

      >

        <span>Navigation Menu</span>

        <span>{mobileOpen ? '✕' : '☰'}</span>

      </button>



      <aside
        className={`
          lg:block w-full lg:w-64 shrink-0 lg:sticky lg:top-0 lg:self-start
          lg:max-h-full lg:overflow-y-auto custom-scrollbar
          ${mobileOpen ? 'block mb-4' : 'hidden lg:block'}
        `}
      >

        {navContent}

      </aside>

    </>

  );

}


