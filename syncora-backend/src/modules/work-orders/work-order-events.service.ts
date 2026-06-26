import { Injectable } from '@nestjs/common';
import { WorkOrderStatus, NotificationType } from '@prisma/client';
import { WsGateway } from '../ws/ws.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../../prisma/prisma.service';

interface StatusChangedOrder {
  id: string;
  orderNumber: string;
  status: WorkOrderStatus;
  customerId: string;
  technicianId: string | null;
}

@Injectable()
export class WorkOrderEventsService {
  constructor(
    private wsGateway: WsGateway,
    private notificationsService: NotificationsService,
    private prisma: PrismaService,
  ) {}

  async recordStatusChange(
    workOrderId: string,
    fromStatus: WorkOrderStatus,
    toStatus: WorkOrderStatus,
    userId: string,
    note?: string,
  ) {
    await this.prisma.statusHistory.create({
      data: {
        workOrderId,
        fromStatus,
        toStatus,
        changedById: userId,
        note,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'STATUS_UPDATE',
        entityType: 'WORK_ORDER',
        entityId: workOrderId,
        userId,
        metadata: { from: fromStatus, to: toStatus },
      },
    });
  }

  async notifyHqUsers(
    type: NotificationType,
    title: string,
    message: string,
    workOrderId: string,
  ) {
    const hqUsers = await this.prisma.user.findMany({
      where: { role: 'HQ', isActive: true },
      select: { id: true },
    });

    await Promise.all(
      hqUsers.map((hq) =>
        this.notificationsService.create({
          userId: hq.id,
          type,
          title,
          message,
          workOrderId,
        }),
      ),
    );
  }

  async notifyUser(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    workOrderId: string,
  ) {
    await this.notificationsService.create({
      userId,
      type,
      title,
      message,
      workOrderId,
    });
  }

  emitStatusChanged(
    order: StatusChangedOrder,
    toStatus: WorkOrderStatus,
    changedBy: string,
  ) {
    const payload = {
      workOrderId: order.id,
      orderNumber: order.orderNumber,
      fromStatus: order.status,
      toStatus,
      changedBy,
    };

    this.wsGateway.emitToUser(
      order.customerId,
      'workOrder.statusChanged',
      payload,
    );
    if (order.technicianId) {
      this.wsGateway.emitToUser(
        order.technicianId,
        'workOrder.statusChanged',
        payload,
      );
    }
    this.wsGateway.emitToRole('HQ', 'workOrder.statusChanged', payload);
  }

  mapStatusToNotificationType(
    status: WorkOrderStatus,
  ): NotificationType | null {
    switch (status) {
      case 'EN_ROUTE':
        return NotificationType.EN_ROUTE;
      case 'IN_PROGRESS':
        return NotificationType.IN_PROGRESS;
      case 'COMPLETED':
        return NotificationType.JOB_COMPLETED;
      case 'DELAYED':
        return NotificationType.DELAY_ALERT;
      case 'CANCELLED':
        return NotificationType.CANCELLED;
      default:
        return null;
    }
  }

  emitAssigned(
    userId: string,
    workOrderId: string,
    orderNumber: string,
    title: string,
  ) {
    this.wsGateway.emitToUser(userId, 'workOrder.assigned', {
      workOrderId,
      orderNumber,
      title,
    });
  }

  getNotificationTitle(status: WorkOrderStatus): string {
    switch (status) {
      case 'EN_ROUTE':
        return 'Technician En Route';
      case 'IN_PROGRESS':
        return 'Work In Progress';
      case 'COMPLETED':
        return 'Job Completed';
      case 'DELAYED':
        return 'Job Delayed';
      case 'CANCELLED':
        return 'Job Cancelled';
      default:
        return 'Status Updated';
    }
  }
}
