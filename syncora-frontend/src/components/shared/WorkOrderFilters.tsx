'use client';

import { cn } from '@/lib/utils';
import { Search, X } from 'lucide-react';
import type { WorkOrderStatus } from '@/lib/types';

const statuses: Array<{ value: WorkOrderStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'DECLINED', label: 'Declined' },
  { value: 'EN_ROUTE', label: 'En Route' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'DELAYED', label: 'Delayed' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

interface WorkOrderFiltersProps {
  selectedStatus: WorkOrderStatus | 'ALL';
  onStatusChange: (status: WorkOrderStatus | 'ALL') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const statusColors: Record<string, string> = {
  ALL: '',
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  ACCEPTED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  DECLINED: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  EN_ROUTE: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  DELAYED: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

export function WorkOrderFilters({
  selectedStatus,
  onStatusChange,
  searchQuery,
  onSearchChange,
}: WorkOrderFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <input
          type="text"
          placeholder="Search orders by title or number…"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-md border border-border bg-card pl-9 pr-8 py-2 text-sm outline-none focus:border-syncora-500"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-accent"
            aria-label="Clear search"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {statuses.map((s) => (
          <button
            key={s.value}
            onClick={() => onStatusChange(s.value)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              selectedStatus === s.value
                ? statusColors[s.value] || 'bg-syncora-500 text-white'
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
