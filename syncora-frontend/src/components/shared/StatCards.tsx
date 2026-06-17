'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CardSkeleton } from '@/components/shared/Skeleton';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardData {
  title: string;
  value: string | number;
  trend?: { value: number; positive?: boolean };
  icon?: LucideIcon;
  color?: string;
}

interface StatCardsProps {
  stats: StatCardData[];
  loading?: boolean;
}

const colorVariants: Record<string, string> = {
  purple: 'from-syncora-500 to-syncora-600',
  green: 'from-emerald-500 to-emerald-600',
  amber: 'from-amber-500 to-amber-600',
  red: 'from-red-500 to-red-600',
  blue: 'from-blue-500 to-blue-600',
};

function StatCard({ title, value, trend, icon: Icon, color = 'purple' }: StatCardData) {
  return (
    <div className="relative rounded-lg border border-border bg-card p-5 overflow-hidden">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 text-xs">
              {trend.positive ? (
                <TrendingUp className="h-3 w-3 text-emerald-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={trend.positive ? 'text-emerald-500' : 'text-red-500'}>
                {Math.abs(trend.value)}%
              </span>
              <span className="text-muted-foreground">vs last month</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn('rounded-lg p-2.5 bg-gradient-to-br text-white', colorVariants[color] || colorVariants.purple)}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  );
}

export function StatCards({ stats, loading }: StatCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => (
        <StatCard key={s.title} {...s} />
      ))}
    </div>
  );
}
