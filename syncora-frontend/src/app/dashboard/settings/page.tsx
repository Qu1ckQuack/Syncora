'use client';

import { useAuthStore } from '@/lib/auth-store';
import { useTheme } from 'next-themes';
import { useNotificationPreferences, useUpdateNotificationPreferences } from '@/lib/hooks/use-notifications';
import { cn } from '@/lib/utils';
import { Bell, Shield, Moon, Sun, Loader2 } from 'lucide-react';

function Toggle({ label, description, checked, onChange, disabled }: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center justify-between py-3">
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={cn(
          'relative h-6 w-11 rounded-full transition-colors shrink-0',
          checked ? 'bg-syncora-500' : 'bg-muted-foreground/30',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        <span className={cn(
          'block h-5 w-5 rounded-full bg-white shadow-sm transition-transform translate-y-0.5',
          checked ? 'translate-x-[1.375rem]' : 'translate-x-0.5',
        )} />
      </button>
    </label>
  );
}

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const { theme, setTheme } = useTheme();
  const { data: prefs, isLoading } = useNotificationPreferences();
  const update = useUpdateNotificationPreferences();

  if (!user) return null;

  const toggle = (field: 'email' | 'push' | 'status' | 'assignment') => {
    if (!prefs) return;
    update.mutate({ [field]: !prefs[field] });
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your preferences and account settings.</p>
      </div>

      <section className="rounded-lg border border-border bg-card divide-y divide-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Bell className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-sm font-semibold">Notification Preferences</h2>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>

        <div className="px-4">
          <Toggle
            label="Email Notifications"
            description="Receive updates via email"
            checked={prefs?.email ?? true}
            onChange={() => toggle('email')}
            disabled={update.isPending || isLoading}
          />
        </div>

        <div className="px-4">
          <Toggle
            label="Push Notifications"
            description="Receive updates on your device"
            checked={prefs?.push ?? true}
            onChange={() => toggle('push')}
            disabled={update.isPending || isLoading}
          />
        </div>

        <div className="px-4">
          <Toggle
            label="Status Change Alerts"
            description="Get notified when order status changes"
            checked={prefs?.status ?? true}
            onChange={() => toggle('status')}
            disabled={update.isPending || isLoading}
          />
        </div>

        <div className="px-4">
          <Toggle
            label="Assignment Updates"
            description="Get notified when orders are assigned to you"
            checked={prefs?.assignment ?? true}
            onChange={() => toggle('assignment')}
            disabled={update.isPending || isLoading}
          />
        </div>
      </section>

      {user.role === 'MODERATOR' && (
        <section className="rounded-lg border border-border bg-card divide-y divide-border">
          <div className="flex items-center gap-3 px-4 py-3">
            <Shield className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <h2 className="text-sm font-semibold">Access Control</h2>
          </div>

          <div className="px-4 py-3 space-y-2">
            <p className="text-sm font-medium">Role: <span className="text-syncora-500 capitalize">{user.role.toLowerCase()}</span></p>
            <p className="text-xs text-muted-foreground">
              As a moderator, you have full access to all platform features including order management, user administration, and system settings.
            </p>
          </div>

          <div className="px-4 py-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Platform Permissions</p>
            <div className="space-y-1">
              {['Manage Work Orders', 'Manage Users', 'View Analytics', 'System Configuration', 'Audit Logs'].map((perm) => (
                <div key={perm} className="flex items-center gap-2 text-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>{perm}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="rounded-lg border border-border bg-card divide-y divide-border">
        <div className="flex items-center gap-3 px-4 py-3">
          {theme === 'dark' ? <Moon className="h-5 w-5 text-muted-foreground" /> : <Sun className="h-5 w-5 text-muted-foreground" />}
          <h2 className="text-sm font-semibold">Appearance</h2>
        </div>

        <div className="px-4 py-3 flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Theme</p>
            <p className="text-xs text-muted-foreground">Toggle between light and dark mode</p>
          </div>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent transition-colors"
          >
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </section>
    </div>
  );
}
