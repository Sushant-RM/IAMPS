'use client';

import AppRouteGuard from '../components/auth/AppRouteGuard';

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return <AppRouteGuard>{children}</AppRouteGuard>;
}
