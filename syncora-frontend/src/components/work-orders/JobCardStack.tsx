'use client';

import { useRef, useState, useCallback, type ReactNode } from 'react';
import { useUpdateStatus } from '@/lib/hooks/use-work-orders';
import { useAuthStore } from '@/lib/auth-store';
import { NEXT_STATUS, getValidTransitions } from '@/lib/status-transitions';
import { useToastStore } from '@/lib/toast-store';
import { OrderCard } from '@/components/shared/OrderCard';
import { OrderCardSkeleton } from '@/components/shared/OrderCard';
import { Flag, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorkOrder, WorkOrderStatus } from '@/lib/types';

const SWIPE_THRESHOLD = 80;

interface SwipeableCardProps {
  children: ReactNode;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
}

function SwipeableCard({ children, onSwipeRight, onSwipeLeft }: SwipeableCardProps) {
  const [offsetX, setOffsetX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const startX = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    setSwiping(true);
    startX.current = e.clientX;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!swiping) return;
    const dx = e.clientX - startX.current;
    setOffsetX(Math.max(-150, Math.min(150, dx)));
  }, [swiping]);

  const handlePointerUp = useCallback(() => {
    setSwiping(false);
    if (offsetX > SWIPE_THRESHOLD) {
      onSwipeRight();
    } else if (offsetX < -SWIPE_THRESHOLD) {
      onSwipeLeft();
    }
    setOffsetX(0);
  }, [offsetX, onSwipeRight, onSwipeLeft]);

  return (
    <div className="relative overflow-hidden rounded-lg">
      <div
        className="absolute inset-y-0 left-0 flex items-center pl-4 text-green-500 bg-green-50 dark:bg-green-950/30"
        style={{ opacity: Math.max(0, offsetX / SWIPE_THRESHOLD) }}
        aria-hidden="true"
      >
        <ChevronRight className="h-5 w-5" />
        <span className="text-xs font-medium ml-1">Complete</span>
      </div>
      <div
        className="absolute inset-y-0 right-0 flex items-center pr-4 text-red-500 bg-red-50 dark:bg-red-950/30"
        style={{ opacity: Math.max(0, -offsetX / SWIPE_THRESHOLD) }}
        aria-hidden="true"
      >
        <Flag className="h-4 w-4" />
        <span className="text-xs font-medium ml-1">Flag</span>
      </div>
      <div
        ref={cardRef}
        className={cn(
          'relative bg-card transition-transform',
          swiping ? '' : 'duration-200 ease-out',
        )}
        style={{ transform: `translateX(${offsetX}px)` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={() => handlePointerUp()}
        onPointerCancel={() => handlePointerUp()}
      >
        {children}
      </div>
    </div>
  );
}

interface JobCardStackProps {
  orders: WorkOrder[];
  isLoading?: boolean;
}

export function JobCardStack({ orders, isLoading }: JobCardStackProps) {
  const user = useAuthStore((s) => s.user);
  const updateStatus = useUpdateStatus();
  const addToast = useToastStore((s) => s.addToast);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => <OrderCardSkeleton key={i} />)}
      </div>
    );
  }

  const canAct = user?.role === 'TECHNICIAN' || user?.role === 'MODERATOR';

  const handleSwipeRight = (order: WorkOrder) => {
    if (!canAct) return;
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    updateStatus.mutate({ id: order.id, status: next }, {
      onSuccess: () => {
        addToast({ type: 'success', title: 'Status updated', message: `Moved to ${next.replace('_', ' ')}`, duration: 3000 });
      },
    });
  };

  const handleSwipeLeft = (order: WorkOrder) => {
    if (!canAct || order.status === 'DELAYED' || order.status === 'CANCELLED') return;
    updateStatus.mutate({ id: order.id, status: 'DELAYED' as WorkOrderStatus }, {
      onSuccess: () => {
        addToast({ type: 'warning', title: 'Issue flagged', message: 'Job marked as delayed', duration: 3000 });
      },
    });
  };

  const activeOrder = orders.find(
    (o) => o.status === 'IN_PROGRESS' || o.status === 'EN_ROUTE',
  );
  const stackOrders = activeOrder
    ? [activeOrder, ...orders.filter((o) => o.id !== activeOrder.id)]
    : orders;

  return (
    <div className="space-y-2" role="list" aria-label="Work orders">
      {stackOrders.map((order) => {
        const isActive = activeOrder?.id === order.id;
        const transitions = canAct ? getValidTransitions(order.status, user?.role ?? 'CUSTOMER') : [];

        const card = (
          <OrderCard
            order={order}
            variant="stack"
            showNavigate
            showStatusPicker={transitions.length > 0}
            validTransitions={transitions}
            isActive={isActive}
          />
        );

        if (canAct && transitions.length > 0) {
          return (
            <SwipeableCard
              key={order.id}
              onSwipeRight={() => handleSwipeRight(order)}
              onSwipeLeft={() => handleSwipeLeft(order)}
            >
              {card}
            </SwipeableCard>
          );
        }

        return <div key={order.id}>{card}</div>;
      })}
    </div>
  );
}
