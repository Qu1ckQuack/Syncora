'use client';

import { useState } from 'react';
import { useWorkOrders } from '@/lib/hooks/use-work-orders';
import { WorkOrderFilters } from '@/components/shared/WorkOrderFilters';
import { StatusPill } from '@/components/shared/StatusPill';
import { TableSkeleton } from '@/components/shared/Skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { JobCardStack } from '@/components/work-orders/JobCardStack';
import { useAuthStore } from '@/lib/auth-store';
import { ClipboardList, ChevronRight, Plus } from 'lucide-react';
import Link from 'next/link';
import type { WorkOrderStatus } from '@/lib/types';

export default function WorkOrdersPage() {
  const user = useAuthStore((s) => s.user);
  const { data: orders, isLoading } = useWorkOrders();
  const [selectedStatus, setSelectedStatus] = useState<WorkOrderStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = (orders ?? []).filter((o) => {
    if (selectedStatus !== 'ALL' && o.status !== selectedStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!o.title.toLowerCase().includes(q) && !o.orderNumber.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Work Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} of {orders?.length ?? 0} orders
          </p>
        </div>
        {(user?.role === 'HQ' || user?.role === 'CUSTOMER') && (
          <Link href="/dashboard/work-orders/new" className="flex items-center gap-2 rounded-md bg-syncora-500 px-4 py-2 text-sm font-medium text-white hover:bg-syncora-600 transition-colors">
            <Plus className="h-4 w-4" aria-hidden="true" />
            New Order
          </Link>
        )}
      </div>

      <WorkOrderFilters
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {isLoading ? (
        <>
          <div className="sm:hidden">
            <JobCardStack orders={[]} isLoading />
          </div>
          <div className="hidden sm:block">
            <TableSkeleton rows={8} />
          </div>
        </>
      ) : !filtered.length ? (
        <EmptyState
          icon={ClipboardList}
          title="No work orders found"
          description={searchQuery || selectedStatus !== 'ALL' ? 'Try adjusting your filters.' : 'Work orders will appear here once created.'}
        />
      ) : (
        <>
          <div className="sm:hidden">
            <JobCardStack orders={filtered} />
          </div>
          <div className="hidden sm:block rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Title</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Priority</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Assigned To</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden xl:table-cell">Location</th>
                  <th className="w-10 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{o.orderNumber}</td>
                    <td className="px-4 py-3 font-medium">{o.title}</td>
                    <td className="px-4 py-3 hidden sm:table-cell"><StatusPill status={o.status} /></td>
                    <td className="px-4 py-3 hidden md:table-cell"><StatusPill status={o.priority} variant="priority" /></td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{o.technician?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden xl:table-cell">{o.location ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/work-orders/${o.id}`} aria-label={`View ${o.orderNumber}`}>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
