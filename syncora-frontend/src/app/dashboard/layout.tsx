import type { ReactNode } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen">
      <aside className="hidden lg:flex w-60 flex-col border-r border-border bg-sidebar">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-sidebar-border">
          <svg
            width="24"
            height="24"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <rect width="40" height="40" rx="8" fill="#7B2FF7" />
            <circle cx="20" cy="20" r="10" stroke="white" strokeWidth="2" />
            <circle cx="20" cy="20" r="3" fill="white" />
          </svg>
          <span className="text-sm font-bold">
            <span className="text-syncora-500">Sync</span>
            <span className="text-muted-foreground">ora</span>
          </span>
        </div>
        <nav className="flex-1 p-4 space-y-1">{/* Nav items will go here */}</nav>
        <div className="p-4 border-t border-sidebar-border">{/* User info + logout */}</div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="sticky top-0 z-10 h-14 border-b border-topbar-border bg-topbar flex items-center px-6 gap-4">
          {/* TopBar content will go here */}
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
