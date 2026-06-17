'use client';

import { cn } from '@/lib/utils';
import type { WorkOrderStatus } from '@/lib/types';
import { Clock, PlayCircle, CheckCircle2, XCircle } from 'lucide-react';

const steps: Array<{ status: WorkOrderStatus; label: string; icon: typeof Clock }> = [
  { status: 'PENDING', label: 'Order Placed', icon: Clock },
  { status: 'IN_PROGRESS', label: 'In Progress', icon: PlayCircle },
  { status: 'COMPLETED', label: 'Completed', icon: CheckCircle2 },
];

const currentStepIndex = (status: WorkOrderStatus) => {
  const idx = steps.findIndex((s) => s.status === status);
  return idx >= 0 ? idx : status === 'CANCELLED' ? -1 : 2;
};

export function ProgressTracker({ status }: { status: WorkOrderStatus }) {
  const current = currentStepIndex(status);
  const cancelled = status === 'CANCELLED';

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const done = i <= current;
          const active = i === current;

          return (
            <div key={step.status} className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  'flex items-center justify-center h-10 w-10 rounded-full border-2 transition-all',
                  done && !cancelled
                    ? 'border-syncora-500 bg-syncora-50 dark:bg-syncora-900/30 text-syncora-600'
                    : cancelled && i <= current
                      ? 'border-red-400 bg-red-50 dark:bg-red-900/30 text-red-500'
                      : 'border-muted-foreground/30 text-muted-foreground/50',
                  active && !cancelled && 'ring-2 ring-syncora-500/30',
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className={cn(
                'mt-2 text-xs font-medium text-center',
                done && !cancelled ? 'text-syncora-600' : 'text-muted-foreground/50',
                cancelled && i <= current && 'text-red-500',
              )}>
                {step.label}
              </p>
              {i < steps.length - 1 && (
                <div className={cn(
                  'h-0.5 flex-1 mt-[-1.25rem] mx-4',
                  done && !cancelled
                    ? 'bg-syncora-500'
                    : cancelled && current >= 0 && i < current
                      ? 'bg-red-400'
                      : 'bg-muted-foreground/20',
                )} />
              )}
            </div>
          );
        })}
      </div>

      {cancelled && (
        <div className="flex items-center justify-center gap-2 mt-6 text-red-500">
          <XCircle className="h-5 w-5" aria-hidden="true" />
          <span className="text-sm font-medium">This order was cancelled</span>
        </div>
      )}
    </div>
  );
}
