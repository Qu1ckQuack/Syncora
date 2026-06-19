'use client';

import Link from 'next/link';
import { StatusPill } from './StatusPill';
import { useUpdateStatus } from '@/lib/hooks/use-work-orders';
import { ChevronRight, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorkOrder, WorkOrderStatus } from '@/lib/types';

function getMapsUrl(lat: number, lng: number): string {
  if (typeof navigator === 'undefined') {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  return isIOS
    ? `maps://app?daddr=${lat},${lng}`
    : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

function EtaDisplay({ order }: { order: WorkOrder }) {
  if (!order.scheduledStart) return null;

  const start = new Date(order.scheduledStart);
  const now = new Date();
  const diffMs = start.getTime() - now.getTime();
  const diffMin = Math.round(diffMs / 60000);

  let label: string;
  if (diffMin < 0) {
    label = `Started ${Math.abs(diffMin)}m ago`;
  } else if (diffMin < 60) {
    label = `ETA: ~${diffMin} min`;
  } else {
    label = `ETA: ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  return <span className="text-xs text-muted-foreground">{label}</span>;
}

function NavigateButton({ order }: { order: WorkOrder }) {
  if (order.latitude == null || order.longitude == null) return null;

  const url = getMapsUrl(order.latitude, order.longitude);

  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 text-xs text-syncora-500 hover:underline min-h-[44px] min-w-[44px]"
      onClick={(e) => {
        e.stopPropagation();
        window.open(url, '_blank', 'noopener,noreferrer');
      }}
      aria-label="Open in Maps"
    >
      <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
      Navigate
    </button>
  );
}

interface StatusSelectorProps {
  order: WorkOrder;
  transitions: WorkOrderStatus[];
}

function StatusSelector({ order, transitions }: StatusSelectorProps) {
  const updateStatus = useUpdateStatus();

  if (transitions.length === 0) return null;

  return (
    <select
      value=""
      onChange={(e) => {
        if (!e.target.value) return;
        updateStatus.mutate({ id: order.id, status: e.target.value });
      }}
      className="text-xs rounded-md border border-border bg-card px-2 py-1 min-h-[36px] outline-none focus:border-syncora-500 cursor-pointer"
      aria-label="Update status"
      onClick={(e) => e.stopPropagation()}
    >
      <option value="">Update…</option>
      {transitions.map((s) => (
        <option key={s} value={s}>
          {s.replace(/_/g, ' ')}
        </option>
      ))}
    </select>
  );
}

interface OrderCardProps {
  order: WorkOrder;
  variant?: 'default' | 'stack';
  showNavigate?: boolean;
  showStatusPicker?: boolean;
  validTransitions?: WorkOrderStatus[];
  isActive?: boolean;
}

export function OrderCard({
  order,
  variant = 'default',
  showNavigate = false,
  showStatusPicker = false,
  validTransitions = [],
  isActive = false,
}: OrderCardProps) {
  const isStack = variant === 'stack';

  return (
    <Link
      href={`/dashboard/work-orders/${order.id}`}
      className={cn(
        'block rounded-lg border border-border bg-card p-4 transition-colors',
        isStack ? 'hover:bg-accent/50 active:bg-accent min-h-[120px]' : 'hover:bg-accent/50 active:bg-accent',
        isActive && 'border-syncora-500 ring-1 ring-syncora-500/20',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs text-muted-foreground">{order.orderNumber}</span>
            <StatusPill status={order.status} />
          </div>
          <p className={cn('font-medium truncate', isStack ? 'text-base' : 'text-sm')}>{order.title}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <StatusPill status={order.priority} variant="priority" />
            {order.technician?.name && <span>{order.technician.name}</span>}
            {order.location && <span className="truncate">{order.location}</span>}
            <EtaDisplay order={order} />
          </div>
          {isStack && (
            <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border">
              {showNavigate && <NavigateButton order={order} />}
              {showStatusPicker && (
                <StatusSelector order={order} transitions={validTransitions} />
              )}
            </div>
          )}
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
