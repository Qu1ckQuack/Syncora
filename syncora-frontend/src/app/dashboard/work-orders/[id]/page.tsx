'use client';

import { use, useState, useMemo } from 'react';
import { useWorkOrder, useUpdateStatus } from '@/lib/hooks/use-work-orders';
import { useAuthStore } from '@/lib/auth-store';
import { StatusPill } from '@/components/shared/StatusPill';
import { ProgressTracker } from '@/components/shared/ProgressTracker';
import { CardSkeleton } from '@/components/shared/Skeleton';
import { getValidTransitions } from '@/lib/status-transitions';
import { ArrowLeft, Clock, User, MapPin, Calendar, History } from 'lucide-react';
import Link from 'next/link';

export default function WorkOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const user = useAuthStore((s) => s.user);
  const { data: order, isLoading } = useWorkOrder(id);
  const updateStatus = useUpdateStatus();
  const [selectedStatus, setSelectedStatus] = useState('');

  const validTransitions = useMemo(
    () => order ? getValidTransitions(order.status, user?.role ?? 'CUSTOMER') : [],
    [order, user?.role],
  );

  if (isLoading) return <CardSkeleton />;
  if (!order) return <p className="text-muted-foreground">Work order not found.</p>;

  const isModerator = user?.role === 'MODERATOR';
  const isAssignedTechnician = user?.role === 'TECHNICIAN' && order.technicianId === user.id;
  const canUpdateStatus = isModerator || isAssignedTechnician;

  const handleStatusUpdate = () => {
    if (!selectedStatus) return;
    updateStatus.mutate({ id, status: selectedStatus }, {
      onSuccess: () => setSelectedStatus(''),
    });
  };

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/dashboard/work-orders" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Work Orders
      </Link>

      <div className="rounded-lg border border-border bg-card p-6 space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs text-muted-foreground font-mono">{order.orderNumber}</p>
            <h1 className="text-xl font-bold mt-1">{order.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill status={order.status} />
            <StatusPill status={order.priority} variant="priority" />
          </div>
        </div>

        {user?.role === 'CUSTOMER' && (
          <ProgressTracker status={order.status} />
        )}

        <div className="grid gap-4 sm:grid-cols-2 text-sm">
          {order.description && (
            <div className="sm:col-span-2">
              <p className="text-muted-foreground mb-1">Description</p>
              <p>{order.description}</p>
            </div>
          )}
          <div>
            <p className="text-muted-foreground mb-1 flex items-center gap-1">
              <User className="h-3.5 w-3.5" /> Customer
            </p>
            <p className="font-medium">{order.customer?.name ?? '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1 flex items-center gap-1">
              <User className="h-3.5 w-3.5" /> Technician
            </p>
            <p className="font-medium">{order.technician?.name ?? '—'}</p>
          </div>
          {order.location && (
            <div>
              <p className="text-muted-foreground mb-1 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> Location
              </p>
              <p className="font-medium">{order.location}</p>
            </div>
          )}
          {order.scheduledStart && (
            <div>
              <p className="text-muted-foreground mb-1 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Scheduled
              </p>
              <p className="font-medium">{new Date(order.scheduledStart).toLocaleDateString()}</p>
            </div>
          )}
          {order.actualEnd && (
            <div>
              <p className="text-muted-foreground mb-1 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Completed
              </p>
              <p className="font-medium">{new Date(order.actualEnd).toLocaleDateString()}</p>
            </div>
          )}
          <div>
            <p className="text-muted-foreground mb-1 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> Created
            </p>
            <p className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {canUpdateStatus && (
          <div className="border-t border-border pt-4">
            <p className="text-sm font-semibold mb-2">Update Status</p>
            <div className="flex items-center gap-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-syncora-500"
              >
                <option value="">Select status…</option>
                {validTransitions.map((s) => (
                  <option key={s} value={s}>
                    {s === 'EN_ROUTE' ? 'En Route' : s === 'IN_PROGRESS' ? 'In Progress' : s === 'COMPLETED' ? 'Completed' : s === 'DELAYED' ? 'Delayed' : s === 'CANCELLED' ? 'Cancel' : s}
                  </option>
                ))}
              </select>
              <button
                onClick={handleStatusUpdate}
                disabled={!selectedStatus || updateStatus.isPending}
                className="rounded-md bg-syncora-500 px-4 py-2 text-sm font-medium text-white hover:bg-syncora-600 transition-colors disabled:opacity-50"
              >
                {updateStatus.isPending ? 'Updating…' : 'Update'}
              </button>
              {updateStatus.isError && (
                <p className="text-xs text-red-500">{updateStatus.error?.message ?? 'Failed to update status'}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {order.statusHistory && order.statusHistory.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <History className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Status History</h2>
          </div>
          <div className="space-y-3">
            {order.statusHistory.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 text-sm">
                <div className="flex flex-col items-center">
                  <div className="h-2.5 w-2.5 rounded-full bg-syncora-500 mt-1.5" />
                  <div className="w-px flex-1 bg-border min-h-4" />
                </div>
                <div className="flex-1 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{entry.fromStatus ?? 'Created'}</span>
                    <span className="text-muted-foreground">→</span>
                    <StatusPill status={entry.toStatus} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    by {entry.changedBy?.name ?? 'System'} &middot; {new Date(entry.createdAt).toLocaleString()}
                  </p>
                  {entry.note && (
                    <p className="text-xs text-muted-foreground mt-0.5 italic">{entry.note}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
