import { cn } from '@/lib/utils';
import {
  Loader2,
  Clock,
  CircleCheck,
  CircleX,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  WifiOff,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Gauge,
  type LucideIcon,
} from 'lucide-react';

type WorkOrderStatus =
  | 'IN_PROGRESS'
  | 'PENDING'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'EN_ROUTE'
  | 'COMPLETED'
  | 'DELAYED'
  | 'CANCELLED';

type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

const statusConfig: Record<
  WorkOrderStatus,
  { icon: LucideIcon; label: string; color: string }
> = {
  IN_PROGRESS: { icon: Loader2, label: 'In Progress', color: 'text-status-active' },
  PENDING: { icon: Clock, label: 'Pending', color: 'text-status-pending' },
  ACCEPTED: { icon: CircleCheck, label: 'Accepted', color: 'text-emerald-600 dark:text-emerald-400' },
  DECLINED: { icon: CircleX, label: 'Declined', color: 'text-red-600 dark:text-red-400' },
  EN_ROUTE: { icon: Navigation, label: 'En Route', color: 'text-status-transit' },
  COMPLETED: { icon: CheckCircle2, label: 'Completed', color: 'text-status-done' },
  DELAYED: { icon: AlertTriangle, label: 'Delayed', color: 'text-status-alert' },
  CANCELLED: { icon: WifiOff, label: 'Cancelled', color: 'text-status-offline' },
};

const priorityConfig: Record<
  Priority,
  { icon: LucideIcon; label: string; color: string }
> = {
  LOW: { icon: ArrowDown, label: 'Low', color: 'border-emerald-200 text-emerald-600 dark:border-emerald-800 dark:text-emerald-400' },
  MEDIUM: { icon: ArrowRight, label: 'Medium', color: 'border-amber-200 text-amber-600 dark:border-amber-800 dark:text-amber-400' },
  HIGH: { icon: ArrowUp, label: 'High', color: 'border-orange-200 text-orange-600 dark:border-orange-800 dark:text-orange-400' },
  URGENT: { icon: Gauge, label: 'Urgent', color: 'border-red-200 text-red-600 dark:border-red-800 dark:text-red-400' },
};

export function StatusPill({
  status,
  variant = 'status',
  className,
}: {
  status: string;
  variant?: 'status' | 'priority';
  className?: string;
}) {
  if (variant === 'priority') {
    const config = priorityConfig[status as Priority];
    if (!config) return <span className="text-xs text-muted-foreground">{status}</span>;
    const Icon = config.icon;
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border',
          config.color,
          className,
        )}
      >
        <Icon className="h-3 w-3" aria-hidden="true" />
        {config.label}
      </span>
    );
  }

  const config = statusConfig[status as WorkOrderStatus] ?? statusConfig.PENDING;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border',
        config.color,
        className,
      )}
    >
      <Icon
        className={cn('h-3 w-3', status === 'IN_PROGRESS' && 'animate-spin')}
        aria-hidden="true"
      />
      {config.label}
    </span>
  );
}
