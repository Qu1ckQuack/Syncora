'use client';

import { useQuery } from '@tanstack/react-query';
import type { User } from '@/lib/types';

async function fetchUsers(role?: string): Promise<User[]> {
  const params = role ? `?role=${role}` : '';
  const res = await fetch(`/api/users${params}`);
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export function useUsers(role?: string) {
  return useQuery({
    queryKey: ['users', role],
    queryFn: () => fetchUsers(role),
  });
}
