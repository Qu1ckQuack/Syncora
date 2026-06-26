import type { WorkOrderStatus } from './types';

export const VALID_TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  PENDING: ['ACCEPTED', 'DECLINED', 'DELAYED', 'CANCELLED'],
  ACCEPTED: ['EN_ROUTE', 'DELAYED', 'CANCELLED'],
  DECLINED: [],
  EN_ROUTE: ['IN_PROGRESS', 'DELAYED', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'DELAYED', 'CANCELLED'],
  DELAYED: ['PENDING', 'EN_ROUTE', 'IN_PROGRESS', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export const NEXT_STATUS: Record<WorkOrderStatus, WorkOrderStatus | null> = {
  PENDING: 'ACCEPTED',
  ACCEPTED: 'EN_ROUTE',
  DECLINED: null,
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
  if (role !== 'HQ') {
    transitions = transitions.filter((s) => s !== 'CANCELLED');
  }
  if (role !== 'TECHNICIAN') {
    transitions = transitions.filter((s) => s !== 'ACCEPTED' && s !== 'DECLINED');
  }
  return transitions;
}
