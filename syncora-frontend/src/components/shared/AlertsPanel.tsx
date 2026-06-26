'use client';

import { useNotifications, useMarkRead, useMarkAllRead } from '@/lib/hooks/use-notifications';
import { useAuthStore } from '@/lib/auth-store';
import { EmptyState } from '@/components/shared/EmptyState';
import { ListSkeleton } from '@/components/shared/Skeleton';
import { Bell, CheckCheck, AlertTriangle, UserCheck, Navigation, CheckCircle2, Info } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { NotificationType } from '@/lib/types';

const typeIcons: Record<NotificationType, typeof Bell> = {
  JOB_ASSIGNED: UserCheck,
  EN_ROUTE: Navigation,
  IN_PROGRESS: Navigation,
  DELAY_ALERT: AlertTriangle,
  JOB_COMPLETED: CheckCircle2,
  CANCELLED: AlertTriangle,
  DEALER_ASSIGNMENT: UserCheck,
  SYSTEM_ERROR: Info,
};

function NotificationItem({ notification }: { notification: NotificationItem }) {
  const markRead = useMarkRead();
  const Icon = typeIcons[notification.type] || Bell;

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer',
        notification.read ? 'bg-card' : 'bg-accent/50 border-l-2 border-syncora-500',
      )}
      onClick={() => !notification.read && markRead.mutate(notification.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && !notification.read && markRead.mutate(notification.id)}
    >
      <div className={cn(
        'rounded-full p-1.5',
        notification.read ? 'bg-muted text-muted-foreground' : 'bg-syncora-100 text-syncora-600 dark:bg-syncora-900 dark:text-syncora-300',
      )}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm', notification.read ? 'text-muted-foreground' : 'text-foreground font-medium')}>
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.message}</p>
        {notification.workOrder && (
          <Link
            href={`/dashboard/work-orders/${notification.workOrder.id}`}
            className="text-xs text-syncora-500 hover:underline mt-1 inline-block"
            onClick={(e) => e.stopPropagation()}
          >
            {notification.workOrder.orderNumber}
          </Link>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {new Date(notification.createdAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

export function AlertsPanel({ compact }: { compact?: boolean }) {
  const user = useAuthStore((s) => s.user);
  const { data: notifications, isLoading } = useNotifications();
  const markAllRead = useMarkAllRead();

  if (!user) return null;

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  const header = compact ? null : (
    <div className="flex items-center justify-between p-4 border-b border-border">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        <h2 className="text-sm font-semibold">Notifications</h2>
        {unreadCount > 0 && (
          <span className="inline-flex items-center justify-center h-5 min-w-5 rounded-full bg-syncora-500 px-1.5 text-xs font-bold text-white">
            {unreadCount}
          </span>
        )}
      </div>
      {unreadCount > 0 && (
        <button
          onClick={() => markAllRead.mutate(undefined)}
          className="flex items-center gap-1 text-xs text-syncora-500 hover:underline"
        >
          <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Mark all read
        </button>
      )}
    </div>
  );

  const content = (
    <div className={compact ? '' : 'max-h-[400px] overflow-y-auto p-2 space-y-1'}>
      {isLoading ? (
        <ListSkeleton items={3} />
      ) : !notifications?.length ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="You're all caught up!"
          className="py-8"
        />
      ) : (
        notifications.map((n) => (
          <NotificationItem key={n.id} notification={n as NotificationItem} />
        ))
      )}
    </div>
  );

  if (compact) return <div className="p-2 space-y-1">{content}</div>;

  return (
    <div className="rounded-lg border border-border bg-card">
      {header}
      {content}
    </div>
  );
}

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  workOrder: { id: string; orderNumber: string; title: string } | null;
}
