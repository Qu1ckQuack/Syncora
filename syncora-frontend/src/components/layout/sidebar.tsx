'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { filterNavItems } from '@/lib/roles';
import { cn } from '@/lib/utils';
import { LogOut, X } from 'lucide-react';
import { SyncoraLogo, SyncoraWordmark } from './syncora-logo';

export function Sidebar({
  mobile,
  onClose,
}: {
  mobile?: boolean;
  onClose?: () => void;
}) {
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
        <SyncoraLogo />
        <SyncoraWordmark />
        {mobile && (
          <button
            onClick={onClose}
            className="ml-auto p-1 rounded-md hover:bg-accent"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1" aria-label="Main navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            pathname.startsWith(item.href + '/');
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
            <p className="text-xs text-muted-foreground capitalize">
              {user.role.toLowerCase()}
            </p>
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

  return (
    <aside className="hidden lg:flex w-60 flex-col border-r border-border bg-sidebar">
      {nav}
    </aside>
  );
}
