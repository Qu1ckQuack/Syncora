'use client';

import { useWorkOrders } from '@/lib/hooks/use-work-orders';
import { useAuthStore } from '@/lib/auth-store';
import { ProgressTracker } from '@/components/shared/ProgressTracker';
import { StatusPill } from '@/components/shared/StatusPill';
import { EmptyState } from '@/components/shared/EmptyState';
import { CardSkeleton } from '@/components/shared/Skeleton';
import { ClipboardList } from 'lucide-react';
import type { WorkOrder } from '@/lib/types';

function ActiveOrderCard({ order }: { order: WorkOrder }) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{order.title}</h2>
          <p className="text-sm text-muted-foreground font-mono">
            {order.orderNumber}
          </p>
        </div>
        <StatusPill status={order.status} />
      </div>

      <ProgressTracker status={order.status} />

      <div className="grid gap-4 sm:grid-cols-2 text-sm">
        {order.description && (
          <div className="sm:col-span-2">
            <p className="text-muted-foreground mb-1">Description</p>
            <p>{order.description}</p>
          </div>
        )}
        {order.technician?.name && (
          <div>
            <p className="text-muted-foreground mb-1">
              Assigned Technician
            </p>
            <p className="font-medium">{order.technician.name}</p>
          </div>
        )}
        {order.location && (
          <div>
            <p className="text-muted-foreground mb-1">Location</p>
            <p className="font-medium">{order.location}</p>
          </div>
        )}
        {order.scheduledStart && (
          <div>
            <p className="text-muted-foreground mb-1">Scheduled</p>
            <p className="font-medium">
              {new Date(order.scheduledStart).toLocaleDateString()}
            </p>
          </div>
        )}
        {order.actualEnd && (
          <div>
            <p className="text-muted-foreground mb-1">Completed</p>
            <p className="font-medium">
              {new Date(order.actualEnd).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function OrderHistoryList({ orders }: { orders: WorkOrder[] }) {
  if (orders.length <= 1) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold mb-3">Order History</h3>
      <div className="space-y-2">
        {orders.map((o) => (
          <div
            key={o.id}
            className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
          >
            <div>
              <p className="text-sm font-medium">{o.title}</p>
              <p className="text-xs text-muted-foreground font-mono">
                {o.orderNumber}
              </p>
            </div>
            <StatusPill status={o.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CustomerOrdersSection() {
  const user = useAuthStore((s) => s.user);
  const { data: orders, isLoading } = useWorkOrders();

  if (user?.role !== 'CUSTOMER') return null;

  const myOrders = (orders ?? [])
    .filter((o) => o.customerId === user.id)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  const activeOrder =
    myOrders.find((o) => o.status === 'IN_PROGRESS') ?? myOrders[0];

  if (isLoading) return <CardSkeleton />;

  if (!activeOrder) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No orders yet"
        description="You don't have any work orders yet. Create one to get started."
      />
    );
  }

  return (
    <>
      <ActiveOrderCard order={activeOrder} />
      <OrderHistoryList orders={myOrders} />
    </>
  );
}
