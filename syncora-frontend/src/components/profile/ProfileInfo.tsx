'use client';

import { useRef, useState, useEffect } from 'react';
import { useUpdateProfile, useUpdateTechnicianStatus } from '@/lib/hooks/use-users';
import { useAvatarUpload } from '@/lib/hooks/use-upload';
import { useAuthStore } from '@/lib/auth-store';
import { cn } from '@/lib/utils';
import { Loader2, Check, X, Camera } from 'lucide-react';
import type { User } from '@/lib/auth-store';
import type { TechnicianStatus as TS } from '@/lib/types';

interface ProfileInfoProps {
  user: User;
}

export function ProfileInfo({ user }: ProfileInfoProps) {
  const setUser = useAuthStore((s) => s.setUser);
  const updateProfile = useUpdateProfile();
  const updateStatus = useUpdateTechnicianStatus();
  const avatarUpload = useAvatarUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const handleSaveProfile = async () => {
    if (!name.trim()) return;
    const updated = await updateProfile.mutateAsync({ name: name.trim() });
    setUser(updated);
    setEditing(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError(null);
    if (!file.type.startsWith('image/')) {
      setAvatarError('Only image files are allowed.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('File must be under 2 MB.');
      return;
    }

    const preview = URL.createObjectURL(file);
    setAvatarPreview(preview);

    try {
      const result = await avatarUpload.mutateAsync(file);
      const updated = await updateProfile.mutateAsync({
        avatarUrl: result.avatarUrl,
      });
      setUser(updated);
      setAvatarPreview(null);
    } catch {
      setAvatarPreview(null);
      setAvatarError('Upload failed. Please try again.');
    }
  };

  const handleToggleStatus = async () => {
    const nextStatus: TS =
      user.technicianStatus === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
    const updated = await updateStatus.mutateAsync(nextStatus);
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) return;
    setUser({ ...currentUser, technicianStatus: updated.technicianStatus });
  };

  const avatarSrc = avatarPreview ?? user.avatarUrl;

  return (
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
      {avatarError && (
        <p className="text-[11px] text-red-500 whitespace-nowrap -ml-16 mt-2">
          {avatarError}
        </p>
      )}
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
                {updateProfile.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
                Save
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setName(user.name);
                }}
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
              onClick={() => {
                setEditing(true);
                setName(user.name);
              }}
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
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  user.technicianStatus === 'ONLINE'
                    ? 'bg-green-500'
                    : 'bg-gray-400',
                )}
              />
              {user.technicianStatus ?? 'OFFLINE'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
