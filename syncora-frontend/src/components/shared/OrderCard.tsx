import Link from 'next/link';
import { StatusPill } from './StatusPill';
import { ChevronRight } from 'lucide-react';
import type { WorkOrder } from '@/lib/types';

export function OrderCard({ order }: { order: WorkOrder }) {
  return (
    <Link
      href={`/dashboard/work-orders/${order.id}`}
      className="block rounded-lg border border-border bg-card p-4 hover:bg-accent/50 transition-colors active:bg-accent"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-muted-foreground">{order.orderNumber}</span>
            <StatusPill status={order.status} />
          </div>
          <p className="text-sm font-medium truncate">{order.title}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <StatusPill status={order.priority} variant="priority" />
            {order.technician?.name && <span>{order.technician.name}</span>}
            {order.location && <span className="truncate">{order.location}</span>}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 mt-1 shrink-0 text-muted-foreground" aria-hidden="true" />
      </div>
    </Link>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-4 animate-pulse">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-3 w-20 bg-muted rounded" />
            <div className="h-5 w-16 bg-muted rounded-full" />
          </div>
          <div className="h-4 w-3/4 bg-muted rounded" />
          <div className="flex items-center gap-3 mt-2">
            <div className="h-4 w-12 bg-muted rounded-full" />
            <div className="h-3 w-24 bg-muted rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
