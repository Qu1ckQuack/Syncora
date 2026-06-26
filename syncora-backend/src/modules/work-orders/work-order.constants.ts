import type { Prisma } from '@prisma/client';
import { WorkOrderStatus } from '@prisma/client';

export const VALID_TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  PENDING: ['ACCEPTED', 'DECLINED', 'EN_ROUTE', 'DELAYED', 'CANCELLED'],
  ACCEPTED: ['EN_ROUTE', 'DELAYED', 'CANCELLED'],
  DECLINED: [],
  EN_ROUTE: ['IN_PROGRESS', 'DELAYED', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'DELAYED', 'CANCELLED'],
  DELAYED: ['PENDING', 'EN_ROUTE', 'IN_PROGRESS', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export const WORK_ORDER_INCLUDE = {
  customer: { select: { id: true, name: true, email: true } },
  technician: { select: { id: true, name: true } },
} satisfies Prisma.WorkOrderInclude;
