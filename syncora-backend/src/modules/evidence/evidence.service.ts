import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EvidenceType, WorkOrderStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { WsGateway } from '../ws/ws.gateway';

type AuthUser = { id: string; role: string };

const UPLOADABLE_STATUSES: WorkOrderStatus[] = [
  'ACCEPTED',
  'EN_ROUTE',
  'IN_PROGRESS',
  'DELAYED',
];

@Injectable()
export class EvidenceService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
    private wsGateway: WsGateway,
  ) {}

  async create(workOrderId: string, file: Express.Multer.File, user: AuthUser) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const order = await this.prisma.workOrder.findUnique({
      where: { id: workOrderId },
      select: {
        id: true,
        orderNumber: true,
        title: true,
        status: true,
        customerId: true,
        technicianId: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Work order not found');
    }
    if (order.technicianId !== user.id) {
      throw new ForbiddenException('Only the assigned technician can upload evidence');
    }
    if (!UPLOADABLE_STATUSES.includes(order.status)) {
      throw new BadRequestException(
        `Cannot upload evidence while work order is ${order.status}`,
      );
    }

    const type = this.getEvidenceType(file.mimetype);
    const url = await this.uploadService.uploadEvidence(workOrderId, user.id, file);

    const evidence = await this.prisma.evidence.create({
      data: {
        workOrderId,
        technicianId: user.id,
        url,
        type,
      },
      include: {
        technician: { select: { id: true, name: true } },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'EVIDENCE_UPLOADED',
        entityType: 'WORK_ORDER',
        entityId: workOrderId,
        userId: user.id,
        metadata: { evidenceId: evidence.id, type },
      },
    });

    const payload = {
      workOrderId,
      orderNumber: order.orderNumber,
      title: order.title,
      evidence,
    };

    this.wsGateway.emitToUser(order.customerId, 'workOrder.evidenceAdded', payload);
    this.wsGateway.emitToUser(user.id, 'workOrder.evidenceAdded', payload);
    this.wsGateway.emitToRole('HQ', 'workOrder.evidenceAdded', payload);

    return evidence;
  }

  async findForWorkOrder(workOrderId: string, user: AuthUser) {
    const order = await this.prisma.workOrder.findUnique({
      where: { id: workOrderId },
      select: {
        customerId: true,
        technicianId: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Work order not found');
    }

    if (
      user.role !== 'HQ' &&
      !(user.role === 'TECHNICIAN' && order.technicianId === user.id) &&
      !(user.role === 'CUSTOMER' && order.customerId === user.id)
    ) {
      throw new ForbiddenException('You do not have access to this evidence');
    }

    return this.prisma.evidence.findMany({
      where: { workOrderId },
      include: {
        technician: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private getEvidenceType(mimetype: string): EvidenceType {
    if (mimetype.startsWith('image/')) return 'PHOTO';
    if (mimetype.startsWith('video/')) return 'VIDEO';
    throw new BadRequestException('Only image and video files are allowed');
  }
}
