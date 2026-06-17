export const statusColors = {
  active: 'var(--color-status-active)',
  pending: 'var(--color-status-pending)',
  transit: 'var(--color-status-transit)',
  done: 'var(--color-status-done)',
  alert: 'var(--color-status-alert)',
  offline: 'var(--color-status-offline)',
} as const;

export type StatusType = keyof typeof statusColors;
