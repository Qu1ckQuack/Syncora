'use client';

import { useMutation } from '@tanstack/react-query';

async function uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const res = await fetch('/api/upload/avatar', {
      method: 'POST',
      body: formData,
      credentials: 'include',
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message ?? 'Failed to upload avatar');
    }

    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

export function useAvatarUpload() {
  return useMutation({
    mutationFn: (file: File) => uploadAvatar(file),
  });
}
