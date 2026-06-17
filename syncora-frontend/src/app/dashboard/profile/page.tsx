'use client';

import { useAuthStore } from '@/lib/auth-store';
import { useWorkOrders } from '@/lib/hooks/use-work-orders';
import { ProgressTracker } from '@/components/shared/ProgressTracker';
import { StatusPill } from '@/components/shared/StatusPill';
import { EmptyState } from '@/components/shared/EmptyState';
import { CardSkeleton } from '@/components/shared/Skeleton';
import { UserCircle, ClipboardList, Calendar, MapPin } from 'lucide-react';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const { data: orders, isLoading } = useWorkOrders();

  if (!user) return null;

  const myOrders = (orders ?? []).filter((o) => o.customerId === user.id).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const activeOrder = myOrders.find((o) => o.status === 'IN_PROGRESS') ?? myOrders[0];

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-6">
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-syncora-400 to-syncora-600 flex items-center justify-center text-white text-2xl font-bold">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-bold">{user.name}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <span className="inline-flex items-center mt-1 rounded-full bg-syncora-100 dark:bg-syncora-900 px-2.5 py-0.5 text-xs font-medium text-syncora-700 dark:text-syncora-300">
            Customer
          </span>
        </div>
      </div>

      {isLoading ? (
        <CardSkeleton />
      ) : !activeOrder ? (
        <EmptyState
          icon={ClipboardList}
          title="No orders yet"
          description="You don't have any work orders. A moderator will create one for you."
        />
      ) : (
        <div className="rounded-lg border border-border bg-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{activeOrder.title}</h2>
              <p className="text-sm text-muted-foreground font-mono">{activeOrder.orderNumber}</p>
            </div>
            <StatusPill status={activeOrder.status} />
          </div>

          <ProgressTracker status={activeOrder.status} />

          <div className="grid gap-4 sm:grid-cols-2 text-sm">
            {activeOrder.description && (
              <div className="sm:col-span-2">
                <p className="text-muted-foreground mb-1">Description</p>
                <p>{activeOrder.description}</p>
              </div>
            )}
            {activeOrder.technician?.name && (
              <div>
                <p className="text-muted-foreground mb-1">Assigned Technician</p>
                <p className="font-medium">{activeOrder.technician.name}</p>
              </div>
            )}
            {activeOrder.location && (
              <div>
                <p className="text-muted-foreground mb-1">Location</p>
                <p className="font-medium">{activeOrder.location}</p>
              </div>
            )}
            {activeOrder.scheduledStart && (
              <div>
                <p className="text-muted-foreground mb-1">Scheduled</p>
                <p className="font-medium">{new Date(activeOrder.scheduledStart).toLocaleDateString()}</p>
              </div>
            )}
            {activeOrder.actualEnd && (
              <div>
                <p className="text-muted-foreground mb-1">Completed</p>
                <p className="font-medium">{new Date(activeOrder.actualEnd).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {myOrders.length > 1 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Order History</h3>
          <div className="space-y-2">
            {myOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                <div>
                  <p className="text-sm font-medium">{o.title}</p>
                  <p className="text-xs text-muted-foreground font-mono">{o.orderNumber}</p>
                </div>
                <StatusPill status={o.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
