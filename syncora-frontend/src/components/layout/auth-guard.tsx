'use client';

import { useEffect, useMemo, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

const routeRoleMap: Record<string, string[]> = {
  '/dashboard/overview': ['MODERATOR', 'TECHNICIAN'],
  '/dashboard/work-orders': ['MODERATOR', 'TECHNICIAN', 'CUSTOMER'],
  '/dashboard/map': ['MODERATOR', 'TECHNICIAN', 'CUSTOMER'],
  '/dashboard/analytics': ['MODERATOR'],
  '/dashboard/people': ['MODERATOR'],
  '/dashboard/settings': ['MODERATOR'],
  '/dashboard/profile': ['MODERATOR', 'TECHNICIAN', 'CUSTOMER'],
};

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
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
      router.replace('/dashboard/overview');
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
