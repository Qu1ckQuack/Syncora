'use client';

import { useToastStore, type ToastType } from '@/lib/toast-store';
import { cn } from '@/lib/utils';
import { X, CheckCircle2, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { useEffect } from 'react';

const icons: Record<ToastType, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
};

const styles: Record<ToastType, string> = {
  info: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  warning: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200',
  error: 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200',
};

function ToastItem({ toast }: { toast: { id: string; type: ToastType; title: string; message?: string } }) {
  const removeToast = useToastStore((s) => s.removeToast);
  const Icon = icons[toast.type];

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border p-3 shadow-lg min-w-72 max-w-sm animate-in slide-in-from-right',
        styles[toast.type],
      )}
      role="alert"
    >
      <Icon className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{toast.title}</p>
        {toast.message && (
          <p className="text-xs mt-0.5 opacity-80">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="shrink-0 p-0.5 rounded hover:opacity-70"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} />
        </div>
      ))}
    </div>
  );
}
