import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { WsGateway } from '../ws/ws.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private wsGateway: WsGateway,
  ) {}

  async findAll(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      include: {
        workOrder: { select: { id: true, orderNumber: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    workOrderId?: string;
  }) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        workOrderId: data.workOrderId,
      },
      include: {
        workOrder: { select: { id: true, orderNumber: true, title: true } },
      },
    });

    this.wsGateway.emitToUser(data.userId, 'notification.new', notification);

    return notification;
  }

  async markRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new NotFoundException('Notification not found');
    if (notification.userId !== userId) throw new ForbiddenException('Access denied');

    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return { message: 'All notifications marked as read' };
  }
}
