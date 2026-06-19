'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/lib/auth-store';
import { useSocket } from '@/lib/socket';
import { useNotifications, useUnreadCount } from '@/lib/hooks/use-notifications';
import { filterNavItems } from '@/lib/roles';
import { useBreadcrumbs } from '@/lib/hooks/use-breadcrumbs';
import { AlertsPanel } from '@/components/shared/AlertsPanel';
import { ToastContainer } from '@/components/shared/Toast';
import {
  Bell,
  RefreshCw,
  Search,
  Sun,
  Moon,
  LogOut,
  X,
  ChevronRight,
  LayoutDashboard,
  ClipboardList,
  Map,
  Users,
  UserCircle,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function Sidebar({ mobile, onClose }: { mobile?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  if (!user) return null;

  const navItems = filterNavItems(user.role);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const nav = (
    <>
      <div className="flex items-center gap-2 px-6 py-4 border-b border-sidebar-border">
        <svg width="24" height="24" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect width="40" height="40" rx="8" fill="#7B2FF7" />
          <circle cx="20" cy="20" r="10" stroke="white" strokeWidth="2" />
          <circle cx="20" cy="20" r="3" fill="white" />
        </svg>
        <span className="text-sm font-bold">
          <span className="text-syncora-500">Sync</span>
          <span className="text-muted-foreground">ora</span>
        </span>
        {mobile && (
          <button onClick={onClose} className="ml-auto p-1 rounded-md hover:bg-accent" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1" aria-label="Main navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={mobile ? onClose : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                active
                  ? 'bg-syncora-600 text-white'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent',
              )}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="flex-1">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-syncora-500 flex items-center justify-center text-white text-xs font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user.role.toLowerCase()}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Sign Out
        </button>
      </div>
    </>
  );

  if (mobile) {
    return (
      <div className="fixed inset-0 z-50 lg:hidden">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <aside className="fixed inset-y-0 left-0 w-60 flex flex-col bg-sidebar border-r border-sidebar-border z-10">
          {nav}
        </aside>
      </div>
    );
  }

  return <aside className="hidden lg:flex w-60 flex-col border-r border-border bg-sidebar">{nav}</aside>;
}

function TopBar() {
  const { theme, setTheme } = useTheme();
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const { status } = useSocket(() => setLastUpdated(new Date()));
  const { data: unreadData } = useUnreadCount();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setLastUpdated(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const secondsAgo = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
  const unreadCount = unreadData?.count ?? 0;

  const connectionColor = status === 'connected' ? 'bg-green-500' : status === 'reconnecting' ? 'bg-amber-500' : 'bg-red-500';
  const connectionLabel = status === 'connected' ? 'Connected' : status === 'reconnecting' ? 'Reconnecting...' : 'Disconnected';

  return (
    <>
      {mobileMenuOpen && <Sidebar mobile onClose={() => setMobileMenuOpen(false)} />}
      {mobileSearchOpen && (
        <div className="fixed inset-0 z-20 sm:hidden" onClick={() => setMobileSearchOpen(false)} />
      )}

      <header className="sticky top-0 z-30 h-14 border-b border-topbar-border bg-topbar flex items-center px-4 gap-3">
        <button
          className="lg:hidden p-1.5 rounded-md hover:bg-accent min-h-[44px] min-w-[44px] flex items-center justify-center"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open menu"
        >
          <svg width="24" height="24" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect width="40" height="40" rx="8" fill="#7B2FF7" />
            <circle cx="20" cy="20" r="10" stroke="white" strokeWidth="2" />
            <circle cx="20" cy="20" r="3" fill="white" />
          </svg>
        </button>
        <span className="hidden lg:flex items-center gap-2">
          <svg width="24" height="24" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect width="40" height="40" rx="8" fill="#7B2FF7" />
            <circle cx="20" cy="20" r="10" stroke="white" strokeWidth="2" />
            <circle cx="20" cy="20" r="3" fill="white" />
          </svg>
          <span className="text-sm font-bold">
            <span className="text-syncora-500">Sync</span>
            <span className="text-muted-foreground">ora</span>
          </span>
        </span>

          <button
            className="sm:hidden p-2 rounded-md hover:bg-accent min-h-[44px] min-w-[44px] flex items-center justify-center"
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            aria-label="Toggle search"
          >
            <Search className="h-4 w-4" />
          </button>
          <div className={cn(
            'items-center gap-2 flex-1 max-w-sm rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground',
            mobileSearchOpen
              ? 'absolute left-4 right-4 top-14 z-50 bg-background border shadow-lg flex sm:hidden'
              : 'hidden sm:flex',
          )}>
            <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search orders, customers, technicians…"
              className="w-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
              autoFocus={mobileSearchOpen}
            />
          </div>

        <div className="flex-1 sm:flex-none" />

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={cn('h-2 w-2 rounded-full', connectionColor)} aria-hidden="true" />
            <span className="sr-only">{connectionLabel}</span>
          </div>

          <span className="hidden sm:inline text-xs text-muted-foreground">
            Updated {secondsAgo}s ago
          </span>

          <button
            onClick={() => setAlertsOpen(!alertsOpen)}
            className="relative p-1.5 rounded-md hover:bg-accent min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={'Notifications' + (unreadCount ? ` (${unreadCount} unread)` : '')}
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
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={'Switch to ' + (theme === 'dark' ? 'light' : 'dark') + ' mode'}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <button
            onClick={async () => {
              await useAuthStore.getState().logout();
              window.location.href = '/login';
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
          <div className="fixed inset-0 bg-black/50" onClick={() => setAlertsOpen(false)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-card border-l border-border shadow-xl z-10 overflow-y-auto">
            <div className="sticky top-0 bg-card z-10 flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-sm font-semibold">Notifications</h2>
              <button onClick={() => setAlertsOpen(false)} className="p-1.5 rounded-md hover:bg-accent min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="Close">
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

function Breadcrumbs() {
  const pathname = usePathname();
  const segments = useBreadcrumbs();

  if (pathname === '/dashboard/overview') return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {segments.map((seg, i) => (
          <li key={seg.href} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />}
            {i === segments.length - 1 ? (
              <span aria-current="page" className="text-foreground font-medium">{seg.label}</span>
            ) : (
              <Link href={seg.href} className="hover:text-foreground transition-colors">{seg.label}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

const bottomNavIcons: Record<string, typeof LayoutDashboard> = {
  'Overview': LayoutDashboard,
  'Work Orders': ClipboardList,
  'Map': Map,
  'People': Users,
  'Profile': UserCircle,
  'System Settings': Settings,
};

function BottomNav() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  if (!user) return null;

  const items = filterNavItems(user.role);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-border bg-background" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-center justify-around h-14 px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-md text-xs font-medium transition-colors min-w-0 flex-1',
                active
                  ? 'text-syncora-500'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="truncate max-w-full">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-auto p-6 pb-20 lg:pb-6">
          <Breadcrumbs />
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
