import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { WorkOrderStatus, NotificationType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { WsGateway } from '../../modules/ws/ws.gateway';
import { NotificationsService } from '../../modules/notifications/notifications.service';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { AssignWorkOrderDto } from './dto/assign-work-order.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

const VALID_TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  PENDING: ['EN_ROUTE', 'DELAYED', 'CANCELLED'],
  EN_ROUTE: ['IN_PROGRESS', 'DELAYED', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'DELAYED', 'CANCELLED'],
  DELAYED: ['PENDING', 'EN_ROUTE', 'IN_PROGRESS', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

@Injectable()
export class WorkOrdersService {
  private readonly logger = new Logger(WorkOrdersService.name);

  constructor(
    private prisma: PrismaService,
    private wsGateway: WsGateway,
    private notificationsService: NotificationsService,
  ) {}

  async create(dto: CreateWorkOrderDto, user: { id: string; role: string }) {
    // Hardcoded: Replace with DB sequence or dedicated counter table (risks collision on concurrent creates)
    const count = await this.prisma.workOrder.count();
    const orderNumber = `SYN-${1007 + count}`;

    const customerId =
      user.role === 'CUSTOMER' ? user.id : dto.customerId;

    let lat: number | undefined;
    let lng: number | undefined;

    if (dto.location && !dto.latitude && !dto.longitude) {
      const coords = await this.geocodeLocation(dto.location);
      if (coords) {
        lat = coords.lat;
        lng = coords.lng;
      }
    }

    const order = await this.prisma.workOrder.create({
      data: {
        orderNumber,
        title: dto.title,
        description: dto.description,
        priority: dto.priority ?? 'MEDIUM',
        customerId,
        location: dto.location,
        latitude: dto.latitude ?? lat ?? null,
        longitude: dto.longitude ?? lng ?? null,
        scheduledStart: dto.scheduledStart ? new Date(dto.scheduledStart) : null,
        scheduledEnd: dto.scheduledEnd ? new Date(dto.scheduledEnd) : null,
        status: 'PENDING',
      },
    });

    await this.prisma.statusHistory.create({
      data: {
        workOrderId: order.id,
        toStatus: 'PENDING',
        changedById: user.id,
        note: 'Order created',
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'WORK_ORDER_CREATED',
        entityType: 'WORK_ORDER',
        entityId: order.id,
        userId: user.id,
        metadata: { orderNumber, title: dto.title },
      },
    });

    return this.prisma.workOrder.findUnique({
      where: { id: order.id },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        technician: { select: { id: true, name: true } },
      },
    });
  }

  async findAll(user: { id: string; role: string }) {
    const where =
      user.role === 'MODERATOR'
        ? {}
        : user.role === 'TECHNICIAN'
          ? { technicianId: user.id }
          : { customerId: user.id };

    return this.prisma.workOrder.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true } },
        technician: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user: { id: string; role: string }) {
    const order = await this.prisma.workOrder.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        technician: { select: { id: true, name: true } },
        statusHistory: {
          include: { changedBy: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!order) throw new NotFoundException('Work order not found');
    this.checkAccess(order, user);
    return order;
  }

  async update(id: string, dto: UpdateWorkOrderDto, userId: string) {
    const order = await this.prisma.workOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Work order not found');

    let lat: number | undefined;
    let lng: number | undefined;

    if (dto.location && dto.location !== order.location && !dto.latitude && !dto.longitude) {
      const coords = await this.geocodeLocation(dto.location);
      if (coords) {
        lat = coords.lat;
        lng = coords.lng;
      }
    }

    const updated = await this.prisma.workOrder.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        priority: dto.priority,
        location: dto.location,
        latitude: dto.latitude ?? (lat ?? order.latitude),
        longitude: dto.longitude ?? (lng ?? order.longitude),
        scheduledStart: dto.scheduledStart ? new Date(dto.scheduledStart) : undefined,
        scheduledEnd: dto.scheduledEnd ? new Date(dto.scheduledEnd) : undefined,
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        technician: { select: { id: true, name: true } },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'WORK_ORDER_UPDATED',
        entityType: 'WORK_ORDER',
        entityId: id,
        userId,
      },
    });

    return updated;
  }

  async assign(id: string, dto: AssignWorkOrderDto, userId: string) {
    const order = await this.prisma.workOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Work order not found');

    const updated = await this.prisma.workOrder.update({
      where: { id },
      data: { technicianId: dto.technicianId },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        technician: { select: { id: true, name: true } },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'ASSIGNMENT',
        entityType: 'WORK_ORDER',
        entityId: id,
        userId,
        metadata: { technicianId: dto.technicianId },
      },
    });

    await this.notificationsService.create({
      userId: dto.technicianId,
      type: NotificationType.JOB_ASSIGNED,
      title: 'New Job Assigned',
      message: `${order.title} has been assigned to you.`,
      workOrderId: id,
    });

    this.wsGateway.emitToUser(dto.technicianId, 'workOrder.assigned', {
      workOrderId: id,
      orderNumber: order.orderNumber,
      title: order.title,
    });

    return updated;
  }

  async updateStatus(
    id: string,
    dto: UpdateStatusDto,
    user: { id: string; role: string },
  ) {
    const order = await this.prisma.workOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Work order not found');

    if (user.role !== 'MODERATOR' && order.technicianId !== user.id) {
      throw new ForbiddenException('Only the assigned technician can update status');
    }

    const allowed = VALID_TRANSITIONS[order.status];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${dto.status}`,
      );
    }

    if (dto.status === 'CANCELLED' && user.role !== 'MODERATOR') {
      throw new ForbiddenException('Only moderators can cancel work orders');
    }

    const updateData: Record<string, unknown> = { status: dto.status };
    if (dto.status === 'EN_ROUTE' && !order.actualStart) {
      updateData.actualStart = new Date();
    }
    if (dto.status === 'COMPLETED') {
      updateData.actualEnd = new Date();
    }

    const updated = await this.prisma.workOrder.update({
      where: { id },
      data: updateData,
      include: {
        customer: { select: { id: true, name: true, email: true } },
        technician: { select: { id: true, name: true } },
      },
    });

    await this.prisma.statusHistory.create({
      data: {
        workOrderId: id,
        fromStatus: order.status,
        toStatus: dto.status,
        changedById: user.id,
        note: dto.note,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'STATUS_UPDATE',
        entityType: 'WORK_ORDER',
        entityId: id,
        userId: user.id,
        metadata: { from: order.status, to: dto.status },
      },
    });

    const notificationType = this.mapStatusToNotificationType(dto.status);
    if (notificationType) {
      await this.notificationsService.create({
        userId: order.customerId,
        type: notificationType,
        title: this.getNotificationTitle(dto.status),
        message: `${order.title} status updated to ${dto.status.toLowerCase().replace('_', ' ')}.`,
        workOrderId: id,
      });
    }

    this.wsGateway.emitToUser(order.customerId, 'workOrder.statusChanged', {
      workOrderId: id,
      orderNumber: order.orderNumber,
      fromStatus: order.status,
      toStatus: dto.status,
      changedBy: user.id,
    });

    if (order.technicianId) {
      this.wsGateway.emitToUser(order.technicianId, 'workOrder.statusChanged', {
        workOrderId: id,
        orderNumber: order.orderNumber,
        fromStatus: order.status,
        toStatus: dto.status,
        changedBy: user.id,
      });
    }

    return updated;
  }

  async getHistory(id: string) {
    const order = await this.prisma.workOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Work order not found');

    return this.prisma.statusHistory.findMany({
      where: { workOrderId: id },
      include: { changedBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  private checkAccess(
    order: { customerId: string; technicianId: string | null },
    user: { id: string; role: string },
  ) {
    if (user.role === 'MODERATOR') return;
    if (user.role === 'TECHNICIAN' && order.technicianId === user.id) return;
    if (user.role === 'CUSTOMER' && order.customerId === user.id) return;
    throw new ForbiddenException('Access denied');
  }

  private mapStatusToNotificationType(
    status: WorkOrderStatus,
  ): NotificationType | null {
    switch (status) {
      case 'EN_ROUTE':
        return NotificationType.EN_ROUTE;
      case 'COMPLETED':
        return NotificationType.JOB_COMPLETED;
      case 'DELAYED':
        return NotificationType.DELAY_ALERT;
      default:
        return null;
    }
  }

  private getNotificationTitle(status: WorkOrderStatus): string {
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

  private async geocodeLocation(location: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Syncora/1.0' },
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data || data.length === 0) return null;
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    } catch (err) {
      this.logger.warn(`Nominatim geocoding failed for "${location}": ${err}`);
      return null;
    }
  }
}
