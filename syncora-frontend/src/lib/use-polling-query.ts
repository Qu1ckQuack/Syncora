'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useConnectionStore } from '@/lib/use-connection-status';
import type { UseQueryOptions, UseQueryResult, UseMutationResult } from '@tanstack/react-query';

const POLL_WHEN_DISCONNECTED = 15_000;

export function usePollingQuery<TData, TError = Error>(
  options: UseQueryOptions<TData, TError>,
  fallbackInterval?: number | false,
): UseQueryResult<TData, TError> {
  const wsStatus = useConnectionStore((s) => s.status);
  const shouldPoll = wsStatus !== 'connected';

  return useQuery({
    ...options,
    refetchInterval: shouldPoll ? POLL_WHEN_DISCONNECTED : (fallbackInterval ?? false),
  } as UseQueryOptions<TData, TError>);
}

export function useInvalidatingMutation<TData, TVariables>(
  mutationFn: (vars: TVariables) => Promise<TData>,
  queryKeys: (string | string[])[],
): UseMutationResult<TData, Error, TVariables> {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables>({
    mutationFn,
    onSuccess: () => {
      queryKeys.forEach((key) => {
        const normalized = Array.isArray(key) ? key : [key];
        queryClient.invalidateQueries({ queryKey: normalized });
      });
    },
  });
}
