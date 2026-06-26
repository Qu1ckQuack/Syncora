'use client';

import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

const routeRoleMap: Record<string, string[]> = {
  '/dashboard/overview': ['HQ', 'TECHNICIAN'],
  '/dashboard/work-orders': ['HQ', 'TECHNICIAN', 'CUSTOMER', 'DEALER'],
  '/dashboard/map': ['HQ', 'TECHNICIAN', 'CUSTOMER', 'DEALER'],
  '/dashboard/analytics': ['HQ'],
  '/dashboard/people': ['HQ'],
  '/dashboard/settings': ['HQ'],
  '/dashboard/profile': ['HQ', 'TECHNICIAN', 'CUSTOMER', 'DEALER'],
};

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, checkAuth } = useAuthStore();
  const authChecked = useRef(false);

  useEffect(() => {
    if (authChecked.current) return;
    authChecked.current = true;
    checkAuth();
  }, [checkAuth]);

  const allowedRoles = useMemo(() => {
    const matchingPrefix = Object.keys(routeRoleMap).find(
      (prefix) => pathname === prefix || pathname.startsWith(prefix + '/'),
    );
    return matchingPrefix ? routeRoleMap[matchingPrefix] : null;
  }, [pathname]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
      return;
    }
    if (!isLoading && user && allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace(user.role === 'DEALER' ? '/dashboard/work-orders' : '/dashboard/overview');
    }
  }, [isLoading, user, router, allowedRoles]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
