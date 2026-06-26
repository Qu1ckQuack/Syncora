'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/lib/auth-store';
import { useSocket } from '@/lib/socket';
import { useUnreadCount } from '@/lib/hooks/use-notifications';
import { AlertsPanel } from '@/components/shared/AlertsPanel';
import { ToastContainer } from '@/components/shared/Toast';
import { Sidebar } from './sidebar';
import { SyncoraLogo, SyncoraWordmark } from './syncora-logo';
import {
  Bell,
  RefreshCw,
  Search,
  Sun,
  Moon,
  LogOut,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function TopBar() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const { status } = useSocket(() => setLastUpdated(new Date()));
  const { data: unreadData } = useUnreadCount();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(
      () => setLastUpdated(new Date()),
      30000,
    );
    return () => clearInterval(interval);
  }, []);

  const secondsAgo = Math.floor(
    (Date.now() - lastUpdated.getTime()) / 1000,
  );
  const unreadCount = unreadData?.count ?? 0;

  const connectionColor =
    status === 'connected'
      ? 'bg-green-500'
      : status === 'reconnecting'
        ? 'bg-amber-500'
        : 'bg-red-500';
  const connectionLabel =
    status === 'connected'
      ? 'Connected'
      : status === 'reconnecting'
        ? 'Reconnecting...'
        : 'Disconnected';

  return (
    <>
      {mobileMenuOpen && (
        <Sidebar
          mobile
          onClose={() => setMobileMenuOpen(false)}
        />
      )}
      {mobileSearchOpen && (
        <div
          className="fixed inset-0 z-20 sm:hidden"
          onClick={() => setMobileSearchOpen(false)}
        />
      )}

      <header className="sticky top-0 z-30 h-14 border-b border-topbar-border bg-topbar flex items-center px-4 gap-3">
        <button
          className="lg:hidden p-1.5 rounded-md hover:bg-accent min-h-[44px] min-w-[44px] flex items-center justify-center"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open menu"
        >
          <SyncoraLogo />
        </button>
        <span className="hidden lg:flex items-center gap-2">
          <SyncoraLogo />
          <SyncoraWordmark />
        </span>

        <button
          className="sm:hidden p-2 rounded-md hover:bg-accent min-h-[44px] min-w-[44px] flex items-center justify-center"
          onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
          aria-label="Toggle search"
        >
          <Search className="h-4 w-4" />
        </button>
        <div
          className={cn(
            'items-center gap-2 flex-1 max-w-sm rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground',
            mobileSearchOpen
              ? 'absolute left-4 right-4 top-14 z-50 bg-background border shadow-lg flex sm:hidden'
              : 'hidden sm:flex',
          )}
        >
          <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search orders, customers, technicians\u2026"
            className="w-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
            autoFocus={mobileSearchOpen}
          />
        </div>

        <div className="flex-1 sm:flex-none" />

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className={cn('h-2 w-2 rounded-full', connectionColor)}
              aria-hidden="true"
            />
            <span className="sr-only">{connectionLabel}</span>
          </div>

          <span className="hidden sm:inline text-xs text-muted-foreground">
            Updated {secondsAgo}s ago
          </span>

          <button
            onClick={() => setAlertsOpen(!alertsOpen)}
            className="relative p-1.5 rounded-md hover:bg-accent min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={
              'Notifications' +
              (unreadCount ? ` (${unreadCount} unread)` : '')
            }
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-syncora-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          <button
            className="p-1.5 rounded-md hover:bg-accent min-h-[44px] min-w-[44px] flex items-center justify-center"
            onClick={() => setLastUpdated(new Date())}
            aria-label="Refresh dashboard"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          <button
            className="p-1.5 rounded-md hover:bg-accent min-h-[44px] min-w-[44px] flex items-center justify-center"
            onClick={() =>
              setTheme(theme === 'dark' ? 'light' : 'dark')
            }
            aria-label={
              'Switch to ' +
              (theme === 'dark' ? 'light' : 'dark') +
              ' mode'
            }
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          <button
            onClick={async () => {
              await useAuthStore.getState().logout();
              router.push('/login');
            }}
            className="p-1.5 rounded-md hover:bg-accent min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {alertsOpen && (
        <div className="fixed inset-0 z-40">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setAlertsOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-card border-l border-border shadow-xl z-10 overflow-y-auto">
            <div className="sticky top-0 bg-card z-10 flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-sm font-semibold">Notifications</h2>
              <button
                onClick={() => setAlertsOpen(false)}
                className="p-1.5 rounded-md hover:bg-accent min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <AlertsPanel compact />
          </div>
        </div>
      )}

      <ToastContainer />
    </>
  );
}
