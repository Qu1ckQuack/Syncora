'use client';

import { useRef, useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { useWorkOrders } from '@/lib/hooks/use-work-orders';
import { useUpdateProfile, useChangePassword, useUpdateTechnicianStatus } from '@/lib/hooks/use-users';
import { useAvatarUpload } from '@/lib/hooks/use-upload';
import { ProgressTracker } from '@/components/shared/ProgressTracker';
import { StatusPill } from '@/components/shared/StatusPill';
import { EmptyState } from '@/components/shared/EmptyState';
import { CardSkeleton } from '@/components/shared/Skeleton';
import { ClipboardList, Loader2, Check, X, Eye, EyeOff, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TechnicianStatus as TS } from '@/lib/types';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const { data: orders, isLoading } = useWorkOrders();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const updateStatus = useUpdateTechnicianStatus();
  const avatarUpload = useAvatarUpload();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  if (!user) return null;

  const myOrders = (orders ?? []).filter((o) => o.customerId === user.id).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const activeOrder = myOrders.find((o) => o.status === 'IN_PROGRESS') ?? myOrders[0];

  const handleSaveProfile = async () => {
    if (!name.trim()) return;
    const updated = await updateProfile.mutateAsync({ name: name.trim() });
    setUser(updated);
    setEditing(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      return;
    }

    const preview = URL.createObjectURL(file);
    setAvatarPreview(preview);

    try {
      const result = await avatarUpload.mutateAsync(file);
      const updated = await updateProfile.mutateAsync({ avatarUrl: result.avatarUrl });
      setUser(updated);
      setAvatarPreview(null);
    } catch {
      setAvatarPreview(null);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (newPassword.length < 8) {
      setPwError('New password must be at least 8 characters.');
      return;
    }
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      setPwSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setShowPasswordForm(false);
    } catch (err: unknown) {
      setPwError(err instanceof Error ? err.message : 'Failed to change password');
    }
  };

  const handleToggleStatus = async () => {
    const nextStatus: TS = user.technicianStatus === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
    const updated = await updateStatus.mutateAsync(nextStatus);
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) return;
    setUser({ ...currentUser, technicianStatus: updated.technicianStatus });
  };

  const avatarSrc = avatarPreview ?? user.avatarUrl;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0 group">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={user.name}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-syncora-400 to-syncora-600 flex items-center justify-center text-white text-2xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUpload.isPending}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Change photo"
            >
              {avatarUpload.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              ) : (
                <Camera className="h-5 w-5 text-white" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border border-border bg-card px-3 py-1.5 text-sm outline-none focus:border-syncora-500"
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveProfile}
                    disabled={updateProfile.isPending || !name.trim()}
                    className="inline-flex items-center gap-1 rounded-md bg-syncora-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-syncora-600 disabled:opacity-50"
                  >
                    {updateProfile.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                    Save
                  </button>
                  <button
                    onClick={() => { setEditing(false); setName(user.name); }}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"
                  >
                    <X className="h-3 w-3" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-xl font-bold">{user.name}</h1>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs text-syncora-500 hover:underline shrink-0"
                >
                  Edit
                </button>
              </div>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="inline-flex items-center rounded-full bg-syncora-100 dark:bg-syncora-900 px-2.5 py-0.5 text-xs font-medium text-syncora-700 dark:text-syncora-300">
                {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
              </span>
              {user.role === 'TECHNICIAN' && (
                <button
                  onClick={handleToggleStatus}
                  disabled={updateStatus.isPending}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors',
                    user.technicianStatus === 'ONLINE'
                      ? 'border-green-200 text-green-600 bg-green-50 dark:border-green-800 dark:text-green-400 dark:bg-green-950'
                      : 'border-gray-200 text-gray-500 bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:bg-gray-900',
                  )}
                >
                  <span className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    user.technicianStatus === 'ONLINE' ? 'bg-green-500' : 'bg-gray-400',
                  )} />
                  {user.technicianStatus ?? 'OFFLINE'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          {showPasswordForm ? (
            <form onSubmit={handleChangePassword} className="space-y-3 max-w-sm">
              <div>
                <label className="block text-xs font-medium mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-md border border-border bg-card px-3 py-1.5 text-sm outline-none focus:border-syncora-500 pr-8"
                    required
                  />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showCurrent ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-md border border-border bg-card px-3 py-1.5 text-sm outline-none focus:border-syncora-500 pr-8"
                    minLength={8}
                    required
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showNew ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
              {pwError && <p className="text-xs text-red-500">{pwError}</p>}
              {pwSuccess && <p className="text-xs text-green-500">{pwSuccess}</p>}
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={changePassword.isPending || !currentPassword || !newPassword}
                  className="rounded-md bg-syncora-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-syncora-600 disabled:opacity-50"
                >
                  {changePassword.isPending ? 'Changing…' : 'Change Password'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowPasswordForm(false); setPwError(''); setPwSuccess(''); }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowPasswordForm(true)}
              className="text-xs text-syncora-500 hover:underline"
            >
              Change password
            </button>
          )}
        </div>
      </div>

      {user.role === 'CUSTOMER' && (
        <>
          {isLoading ? (
            <CardSkeleton />
          ) : !activeOrder ? (
            <EmptyState
              icon={ClipboardList}
              title="No orders yet"
              description="You don't have any work orders yet. Create one to get started."
            />
          ) : (
            <div className="rounded-lg border border-border bg-card p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{activeOrder.title}</h2>
                  <p className="text-sm text-muted-foreground font-mono">{activeOrder.orderNumber}</p>
                </div>
                <StatusPill status={activeOrder.status} />
              </div>

              <ProgressTracker status={activeOrder.status} />

              <div className="grid gap-4 sm:grid-cols-2 text-sm">
                {activeOrder.description && (
                  <div className="sm:col-span-2">
                    <p className="text-muted-foreground mb-1">Description</p>
                    <p>{activeOrder.description}</p>
                  </div>
                )}
                {activeOrder.technician?.name && (
                  <div>
                    <p className="text-muted-foreground mb-1">Assigned Technician</p>
                    <p className="font-medium">{activeOrder.technician.name}</p>
                  </div>
                )}
                {activeOrder.location && (
                  <div>
                    <p className="text-muted-foreground mb-1">Location</p>
                    <p className="font-medium">{activeOrder.location}</p>
                  </div>
                )}
                {activeOrder.scheduledStart && (
                  <div>
                    <p className="text-muted-foreground mb-1">Scheduled</p>
                    <p className="font-medium">{new Date(activeOrder.scheduledStart).toLocaleDateString()}</p>
                  </div>
                )}
                {activeOrder.actualEnd && (
                  <div>
                    <p className="text-muted-foreground mb-1">Completed</p>
                    <p className="font-medium">{new Date(activeOrder.actualEnd).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {myOrders.length > 1 && (
            <div>
              <h3 className="text-sm font-semibold mb-3">Order History</h3>
              <div className="space-y-2">
                {myOrders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                    <div>
                      <p className="text-sm font-medium">{o.title}</p>
                      <p className="text-xs text-muted-foreground font-mono">{o.orderNumber}</p>
                    </div>
                    <StatusPill status={o.status} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
