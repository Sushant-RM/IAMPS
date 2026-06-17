'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  consumeAuthRedirect,
  getStoredUser,
  isAuthenticated,
  saveAuthRedirect,
} from '../../lib/auth';
import { getDefaultDashboard, isPathAllowedForRole, isPublicPath, requiresAuthentication } from '../../lib/protectedRoutes';

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;

    const path = router.pathname;
    const asPath = router.asPath.split('?')[0];

    if (isPublicPath(asPath)) {
      if (isAuthenticated() && (path === '/login' || path === '/register')) {
        const user = getStoredUser();
        router.replace(getDefaultDashboard(user?.role || 'student'));
        return;
      }
      setReady(true);
      return;
    }

    if (!requiresAuthentication(asPath)) {
      setReady(true);
      return;
    }

    if (!isAuthenticated()) {
      saveAuthRedirect(router.asPath);
      router.replace('/login');
      return;
    }

    const user = getStoredUser();
    if (!user?.role) {
      saveAuthRedirect(router.asPath);
      router.replace('/login');
      return;
    }

    if (!isPathAllowedForRole(asPath, user.role)) {
      router.replace(getDefaultDashboard(user.role));
      return;
    }

    setReady(true);
  }, [router.isReady, router.pathname, router.asPath, router]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}

export { consumeAuthRedirect };
