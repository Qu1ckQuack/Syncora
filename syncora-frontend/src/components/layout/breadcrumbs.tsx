'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useBreadcrumbs } from '@/lib/hooks/use-breadcrumbs';
import { ChevronRight } from 'lucide-react';

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = useBreadcrumbs();

  if (pathname === '/dashboard/overview') return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {segments.map((seg, i) => (
          <li key={seg.href} className="flex items-center gap-1.5">
            {i > 0 && (
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {i === segments.length - 1 ? (
              <span aria-current="page" className="text-foreground font-medium">
                {seg.label}
              </span>
            ) : (
              <Link
                href={seg.href}
                className="hover:text-foreground transition-colors"
              >
                {seg.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
