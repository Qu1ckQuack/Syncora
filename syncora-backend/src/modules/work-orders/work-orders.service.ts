import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { WorkOrderStatus, NotificationType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { GeocodingService } from '../../common/geocoding.service';
import { WorkOrderEventsService } from './work-order-events.service';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { AssignWorkOrderDto } from './dto/assign-work-order.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { VALID_TRANSITIONS, WORK_ORDER_INCLUDE } from './work-order.constants';

@Injectable()
export class WorkOrdersService {
  constructor(
    private prisma: PrismaService,
    private geocodingService: GeocodingService,
    private eventsService: WorkOrderEventsService,
  ) {}

  async create(
    dto: CreateWorkOrderDto,
    user: { id: string; role: string },
  ) {
    const orderNumber = await this.generateOrderNumber();

    if (user.role !== 'CUSTOMER' && !dto.customerId) {
      throw new BadRequestException(
        'customerId is required for non-customer users',
      );
    }

    const customerId = user.role === 'CUSTOMER' ? user.id : dto.customerId!;

    const { lat, lng } = await this.geocodingService.resolveCoordinates(dto);

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
        scheduledStart: dto.scheduledStart
          ? new Date(dto.scheduledStart)
          : null,
        scheduledEnd: dto.scheduledEnd ? new Date(dto.scheduledEnd) : null,
        status: 'PENDING',
      },
    });

    await this.eventsService.recordStatusChange(
      order.id,
      'PENDING',
      'PENDING',
      user.id,
      'Order created',
    );

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
      include: WORK_ORDER_INCLUDE,
    });
  }

  async findAll(user: { id: string; role: string }) {
    const where =
      user.role === 'HQ'
        ? {}
        : user.role === 'TECHNICIAN'
          ? { technicianId: user.id }
          : { customerId: user.id };

    return this.prisma.workOrder.findMany({
      where,
      include: WORK_ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user: { id: string; role: string }) {
    const order = await this.prisma.workOrder.findUnique({
      where: { id },
      include: {
        ...WORK_ORDER_INCLUDE,
        statusHistory: {
          include: { changedBy: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!order) throw new NotFoundException('Work order not found');
    return order;
  }

  async update(id: string, dto: UpdateWorkOrderDto, userId: string) {
    const order = await this.prisma.workOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Work order not found');

    const needsGeocode =
      dto.location &&
      dto.location !== order.location &&
      !dto.latitude &&
      !dto.longitude;

    let lat: number | undefined;
    let lng: number | undefined;

    if (needsGeocode) {
      const coords = await this.geocodingService.resolveCoordinates(dto);
      lat = coords.lat;
      lng = coords.lng;
    }

    const updated = await this.prisma.workOrder.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        priority: dto.priority,
        location: dto.location,
        latitude: dto.latitude ?? lat ?? order.latitude,
        longitude: dto.longitude ?? lng ?? order.longitude,
        scheduledStart: dto.scheduledStart
          ? new Date(dto.scheduledStart)
          : undefined,
        scheduledEnd: dto.scheduledEnd
          ? new Date(dto.scheduledEnd)
          : undefined,
      },
      include: WORK_ORDER_INCLUDE,
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

    const technician = await this.prisma.user.findUnique({
      where: { id: dto.technicianId },
    });
    if (!technician || technician.role !== 'TECHNICIAN') {
      throw new BadRequestException('User is not a technician');
    }

    const updated = await this.prisma.workOrder.update({
      where: { id },
      data: { technicianId: dto.technicianId },
      include: WORK_ORDER_INCLUDE,
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

    await this.eventsService.notifyUser(
      dto.technicianId,
      NotificationType.JOB_ASSIGNED,
      'New Job Assigned',
      `${order.title} has been assigned to you.`,
      id,
    );

    await this.eventsService.notifyUser(
      order.customerId,
      NotificationType.JOB_ASSIGNED,
      'Technician Assigned',
      `A technician has been assigned to ${order.title}.`,
      id,
    );

    this.eventsService.emitAssigned(
      dto.technicianId,
      id,
      order.orderNumber,
      order.title,
    );
    this.eventsService.emitAssigned(
      order.customerId,
      id,
      order.orderNumber,
      order.title,
    );

    return updated;
  }

  async accept(id: string, user: { id: string; role: string }) {
    const order = await this.prisma.workOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Work order not found');
    if (order.technicianId !== user.id) {
      throw new ForbiddenException(
        'Only the assigned technician can accept this work order',
      );
    }
    if (order.status !== 'PENDING') {
      throw new BadRequestException(
        `Cannot accept work order with status ${order.status}`,
      );
    }

    const updated = await this.prisma.workOrder.update({
      where: { id },
      data: { status: 'ACCEPTED' },
      include: WORK_ORDER_INCLUDE,
    });

    await this.eventsService.recordStatusChange(
      id,
      order.status,
      'ACCEPTED',
      user.id,
      'Technician accepted assignment',
    );
    await this.eventsService.notifyHqUsers(
      NotificationType.JOB_ASSIGNED,
      'Assignment Accepted',
      `${order.title} was accepted by the assigned technician.`,
      id,
    );
    await this.eventsService.notifyUser(
      order.customerId,
      NotificationType.JOB_ASSIGNED,
      'Technician Accepted',
      `The technician accepted ${order.title}.`,
      id,
    );
    this.eventsService.emitStatusChanged(order, 'ACCEPTED', user.id);

    return updated;
  }

  async decline(id: string, user: { id: string; role: string }) {
    const order = await this.prisma.workOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Work order not found');
    if (order.technicianId !== user.id) {
      throw new ForbiddenException(
        'Only the assigned technician can decline this work order',
      );
    }
    if (order.status !== 'PENDING') {
      throw new BadRequestException(
        `Cannot decline work order with status ${order.status}`,
      );
    }

    const updated = await this.prisma.workOrder.update({
      where: { id },
      data: { status: 'DECLINED', technicianId: null },
      include: WORK_ORDER_INCLUDE,
    });

    await this.eventsService.recordStatusChange(
      id,
      order.status,
      'DECLINED',
      user.id,
      'Technician declined assignment',
    );
    await this.prisma.auditLog.create({
      data: {
        action: 'ASSIGNMENT_DECLINED',
        entityType: 'WORK_ORDER',
        entityId: id,
        userId: user.id,
        metadata: { previousTechnicianId: user.id },
      },
    });
    await this.eventsService.notifyHqUsers(
      NotificationType.DELAY_ALERT,
      'Assignment Declined',
      `${order.title} was declined and needs reassignment.`,
      id,
    );
    await this.eventsService.notifyUser(
      order.customerId,
      NotificationType.DELAY_ALERT,
      'Technician Reassignment Needed',
      `${order.title} needs a new technician assignment.`,
      id,
    );
    this.eventsService.emitStatusChanged(order, 'DECLINED', user.id);

    return updated;
  }

  async updateStatus(
    id: string,
    dto: UpdateStatusDto,
    user: { id: string; role: string },
  ) {
    const order = await this.prisma.workOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Work order not found');

    if (dto.status === 'ACCEPTED') {
      return this.accept(id, user);
    }
    if (dto.status === 'DECLINED') {
      return this.decline(id, user);
    }

    if (user.role !== 'HQ' && order.technicianId !== user.id) {
      throw new ForbiddenException(
        'Only the assigned technician can update status',
      );
    }

    const allowed = VALID_TRANSITIONS[order.status];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${dto.status}`,
      );
    }

    if (dto.status === 'CANCELLED' && user.role !== 'HQ') {
      throw new ForbiddenException('Only HQs can cancel work orders');
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
      include: WORK_ORDER_INCLUDE,
    });

    await this.eventsService.recordStatusChange(
      id,
      order.status,
      dto.status,
      user.id,
      dto.note,
    );

    const notificationType =
      this.eventsService.mapStatusToNotificationType(dto.status);
    if (notificationType) {
      await this.eventsService.notifyUser(
        order.customerId,
        notificationType,
        this.eventsService.getNotificationTitle(dto.status),
        `${order.title} status updated to ${dto.status.toLowerCase().replace('_', ' ')}.`,
        id,
      );
    }

    this.eventsService.emitStatusChanged(order, dto.status, user.id);

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

  private async generateOrderNumber(): Promise<string> {
    const result = await this.prisma.$transaction(async (tx) => {
      const counter = await tx.workOrderCounter.upsert({
        where: { id: 'order_seq' },
        update: { seq: { increment: 1 } },
        create: { id: 'order_seq', seq: 1001 },
      });
      return `SYN-${counter.seq}`;
    });
    return result;
  }
}
