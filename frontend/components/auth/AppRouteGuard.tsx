'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  getStoredUser,
  isAuthenticated,
  saveAuthRedirect,
} from '../../lib/auth';
import { getDefaultDashboard, isPathAllowedForRole, isPublicPath, requiresAuthentication } from '../../lib/protectedRoutes';

export default function AppRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isPublicPath(pathname)) {
      setReady(true);
      return;
    }

    if (!requiresAuthentication(pathname)) {
      setReady(true);
      return;
    }

    if (!isAuthenticated()) {
      saveAuthRedirect(pathname);
      router.replace('/login');
      return;
    }

    const user = getStoredUser();
    if (!user?.role || !isPathAllowedForRole(pathname, user.role)) {
      router.replace(getDefaultDashboard(user?.role || 'student'));
      return;
    }

    setReady(true);
  }, [pathname, router]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
