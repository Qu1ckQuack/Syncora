'use client';

import { useWorkOrders } from '@/lib/hooks/use-work-orders';
import { StatCards } from '@/components/shared/StatCards';
import { AlertsPanel } from '@/components/shared/AlertsPanel';
import { TableSkeleton, CardSkeleton } from '@/components/shared/Skeleton';
import { WorkOrderFilters } from '@/components/shared/WorkOrderFilters';
import { StatusPill } from '@/components/shared/StatusPill';
import { useAuthStore } from '@/lib/auth-store';
import { useNotifications } from '@/lib/hooks/use-notifications';
import { ClipboardList, Wrench, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function OverviewPage() {
  const user = useAuthStore((s) => s.user);
  const { data: orders, isLoading } = useWorkOrders();
  const { data: notifications } = useNotifications();
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = (orders ?? []).filter((o) => {
    if (filterStatus !== 'ALL' && o.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!o.title.toLowerCase().includes(q) && !o.orderNumber.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const pendingUrgent = orders?.filter((o) => o.priority === 'URGENT' && o.status !== 'COMPLETED' && o.status !== 'CANCELLED').length ?? 0;
  const inProgress = orders?.filter((o) => o.status === 'IN_PROGRESS').length ?? 0;
  const completed = orders?.filter((o) => o.status === 'COMPLETED').length ?? 0;
  const unreadNotifs = notifications?.filter((n) => !n.read).length ?? 0;

  const stats = [
    { title: 'Total Orders', value: orders?.length ?? 0, icon: ClipboardList, color: 'purple' as const, trend: { value: 12, positive: true } },
    { title: 'In Progress', value: inProgress, icon: Wrench, color: 'blue' as const, trend: { value: 8, positive: false } },
    { title: 'Completed', value: completed, icon: CheckCircle2, color: 'green' as const, trend: { value: 24, positive: true } },
    { title: 'Pending Urgent', value: pendingUrgent, icon: AlertTriangle, color: 'red' as const, trend: { value: pendingUrgent > 0 ? 100 : 0, positive: false } },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {user?.role === 'TECHNICIAN' ? 'My Jobs' : user?.role === 'CUSTOMER' ? 'My Orders' : 'Overview'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back, {user?.name?.split(' ')[0] ?? 'User'}
        </p>
      </div>

      <StatCards stats={stats} loading={isLoading} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent Orders</h2>
            <Link href="/dashboard/work-orders" className="text-xs text-syncora-500 hover:underline">
              View all
            </Link>
          </div>

          <WorkOrderFilters
            selectedStatus={filterStatus as any}
            onStatusChange={setFilterStatus as any}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          {isLoading ? (
            <TableSkeleton rows={4} />
          ) : !filtered.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ClipboardList className="h-12 w-12 text-muted-foreground/50 mb-4" aria-hidden="true" />
              <p className="text-muted-foreground">No orders match your filters.</p>
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Title</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Priority</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Assigned To</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 10).map((o) => (
                    <tr key={o.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{o.orderNumber}</td>
                      <td className="px-4 py-3 font-medium">{o.title}</td>
                      <td className="px-4 py-3 hidden sm:table-cell"><StatusPill status={o.status} /></td>
                      <td className="px-4 py-3 hidden md:table-cell"><StatusPill status={o.priority} variant="priority" /></td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{o.technician?.name ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <AlertsPanel />
        </div>
      </div>
    </div>
  );
}
