import type { WorkOrderStatus } from './types';

export const VALID_TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  PENDING: ['EN_ROUTE', 'DELAYED', 'CANCELLED'],
  EN_ROUTE: ['IN_PROGRESS', 'DELAYED', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'DELAYED', 'CANCELLED'],
  DELAYED: ['PENDING', 'EN_ROUTE', 'IN_PROGRESS', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export const NEXT_STATUS: Record<WorkOrderStatus, WorkOrderStatus | null> = {
  PENDING: 'EN_ROUTE',
  EN_ROUTE: 'IN_PROGRESS',
  IN_PROGRESS: 'COMPLETED',
  DELAYED: 'EN_ROUTE',
  COMPLETED: null,
  CANCELLED: null,
};

export function getValidTransitions(
  status: WorkOrderStatus,
  role: string,
): WorkOrderStatus[] {
  let transitions = VALID_TRANSITIONS[status];
  if (role !== 'MODERATOR') {
    transitions = transitions.filter((s) => s !== 'CANCELLED');
  }
  return transitions;
}
