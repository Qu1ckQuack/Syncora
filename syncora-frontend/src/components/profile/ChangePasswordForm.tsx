'use client';

import { useState } from 'react';
import { useChangePassword } from '@/lib/hooks/use-users';
import { Eye, EyeOff } from 'lucide-react';

export function ChangePasswordForm() {
  const changePassword = useChangePassword();
  const [show, setShow] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      setSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to change password',
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 max-w-sm">
      <div>
        <label className="block text-xs font-medium mb-1">
          Current Password
        </label>
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full rounded-md border border-border bg-card px-3 py-1.5 text-sm outline-none focus:border-syncora-500 pr-8"
            required
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            {show ? (
              <EyeOff className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">
          New Password
        </label>
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-md border border-border bg-card px-3 py-1.5 text-sm outline-none focus:border-syncora-500 pr-8"
            minLength={8}
            required
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            {show ? (
              <EyeOff className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {success && <p className="text-xs text-green-500">{success}</p>}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={
            changePassword.isPending || !currentPassword || !newPassword
          }
          className="rounded-md bg-syncora-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-syncora-600 disabled:opacity-50"
        >
          {changePassword.isPending ? 'Changing\u2026' : 'Change Password'}
        </button>
      </div>
    </form>
  );
}
