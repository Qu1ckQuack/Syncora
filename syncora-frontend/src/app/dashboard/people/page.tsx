'use client';

import { useState } from 'react';
import { useUsers, useUpdateUser, useUpdateUserStatus, useDeleteUser } from '@/lib/hooks/use-users';
import { useAuthStore } from '@/lib/auth-store';
import { ListSkeleton } from '@/components/shared/Skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { Search, Users, Wrench, Shield, ShieldOff, Trash2, Pencil, Loader2, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
  ONLINE: 'bg-emerald-500',
  BUSY: 'bg-amber-500',
  OFFLINE: 'bg-red-500',
};

const statusLabels: Record<string, string> = {
  ONLINE: 'Available',
  BUSY: 'Busy',
  OFFLINE: 'Offline',
};

export default function PeoplePage() {
  const currentUser = useAuthStore((s) => s.user);
  const { data: technicians, isLoading } = useUsers('TECHNICIAN');
  const updateUser = useUpdateUser();
  const updateUserStatus = useUpdateUserStatus();
  const deleteUser = useDeleteUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = (technicians ?? []).filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q);
  });

  const handleStartEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const handleSaveEdit = async (id: string) => {
    await updateUser.mutateAsync({ id, name: editName.trim() });
    setEditingId(null);
  };

  const handleToggleBan = async (id: string, currentlyActive: boolean) => {
    await updateUserStatus.mutateAsync({ id, isActive: !currentlyActive });
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteUser.mutateAsync(id);
      setConfirmDelete(null);
    } catch {
      alert('Cannot delete this user. They have related records. Use ban instead.');
      setConfirmDelete(null);
    }
  };

  const isModerator = currentUser?.role === 'MODERATOR';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">People</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} technician{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <input
          type="text"
          placeholder="Search technicians…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-md border border-border bg-card pl-9 pr-4 py-2 text-sm outline-none focus:border-syncora-500"
        />
      </div>

      {isLoading ? (
        <ListSkeleton items={4} />
      ) : !filtered.length ? (
        <EmptyState
          icon={Users}
          title={searchQuery ? 'No technicians match your search' : 'No technicians found'}
          description="Technicians will appear here once they are registered."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <div key={t.id} className={cn(
              'rounded-lg border bg-card p-4 flex items-start gap-4',
              t.isActive ? 'border-border' : 'border-red-200 dark:border-red-900 opacity-60',
            )}>
              <div className="relative shrink-0">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-syncora-400 to-syncora-600 flex items-center justify-center text-white text-sm font-bold">
                  {t.name.charAt(0).toUpperCase()}
                </div>
                <div className={cn(
                  'absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card',
                  statusColors[t.technicianStatus ?? 'OFFLINE'],
                )} />
              </div>
              <div className="flex-1 min-w-0">
                {editingId === t.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full rounded-md border border-border bg-card px-2 py-1 text-sm outline-none focus:border-syncora-500"
                      autoFocus
                    />
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleSaveEdit(t.id)}
                        disabled={updateUser.isPending || !editName.trim()}
                        className="inline-flex items-center gap-1 rounded bg-syncora-500 px-2 py-0.5 text-xs text-white hover:bg-syncora-600 disabled:opacity-50"
                      >
                        {updateUser.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 text-xs hover:bg-accent"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-semibold truncate">{t.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{t.email}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className={cn(
                        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium',
                        t.technicianStatus === 'ONLINE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' :
                        t.technicianStatus === 'BUSY' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' :
                        'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
                      )}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', statusColors[t.technicianStatus ?? 'OFFLINE'])} />
                        {statusLabels[t.technicianStatus ?? 'OFFLINE']}
                      </span>
                      <span className="flex items-center gap-1">
                        <Wrench className="h-3 w-3" aria-hidden="true" />
                        {t._count?.workOrdersAsTechnician ?? 0} jobs
                      </span>
                    </div>
                  </>
                )}

                {isModerator && editingId !== t.id && (
                  <div className="flex items-center gap-1 mt-3 pt-2 border-t border-border">
                    <button
                      onClick={() => handleStartEdit(t.id, t.name)}
                      className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleBan(t.id, t.isActive)}
                      disabled={updateUserStatus.isPending}
                      className={cn(
                        'inline-flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors',
                        t.isActive
                          ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950'
                          : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-950',
                      )}
                    >
                      {t.isActive ? <ShieldOff className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                      {t.isActive ? 'Ban' : 'Unban'}
                    </button>
                    {confirmDelete === t.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(t.id)}
                          disabled={deleteUser.isPending}
                          className="inline-flex items-center gap-1 rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
                        >
                          {deleteUser.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs hover:bg-accent"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(t.id)}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
