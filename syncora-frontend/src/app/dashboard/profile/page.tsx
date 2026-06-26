'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { ProfileInfo } from '@/components/profile/ProfileInfo';
import { ChangePasswordForm } from '@/components/profile/ChangePasswordForm';
import { CustomerOrdersSection } from '@/components/profile/CustomerOrdersSection';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  if (!user) return null;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="rounded-lg border border-border bg-card p-6">
        <ProfileInfo user={user} />

        <div className="mt-4 pt-4 border-t border-border">
          {showPasswordForm ? (
            <div>
              <ChangePasswordForm />
              <button
                type="button"
                onClick={() => setShowPasswordForm(false)}
                className="mt-2 text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
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

      <CustomerOrdersSection />
    </div>
  );
}
