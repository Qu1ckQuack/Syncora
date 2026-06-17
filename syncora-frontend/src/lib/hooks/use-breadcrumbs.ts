'use client';

import { usePathname } from 'next/navigation';

const labelMap: Record<string, string> = {
  'dashboard': 'Dashboard',
  'overview': 'Overview',
  'work-orders': 'Work Orders',
  'people': 'People',
  'settings': 'Settings',
};

export function useBreadcrumbs() {
  const pathname = usePathname();
  const parts = pathname.split('/').filter(Boolean);

  return parts.map((part, i) => ({
    label: labelMap[part] ?? part.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    href: '/' + parts.slice(0, i + 1).join('/'),
  }));
}
