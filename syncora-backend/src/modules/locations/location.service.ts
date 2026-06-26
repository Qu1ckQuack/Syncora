import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LocationService {
  constructor(private prisma: PrismaService) {}

  async getAllTechniciansWithLatestLocation() {
    return this.prisma.user.findMany({
      where: { role: 'TECHNICIAN', isActive: true },
      select: {
        id: true,
        name: true,
        technicianStatus: true,
        technicianLocations: {
          orderBy: { timestamp: 'desc' },
          take: 1,
          select: {
            latitude: true,
            longitude: true,
            accuracy: true,
            timestamp: true,
          },
        },
      },
    });
  }

  async getLatestByTechnician(technicianId: string) {
    return this.prisma.technicianLocation.findFirst({
      where: { technicianId },
      orderBy: { timestamp: 'desc' },
    });
  }

  async getHistoryByTechnician(
    technicianId: string,
    from?: string,
    to?: string,
  ) {
    const where: Record<string, unknown> = { technicianId };
    if (from || to) {
      where.timestamp = {};
      if (from)
        (where.timestamp as Record<string, unknown>).gte = new Date(from);
      if (to) (where.timestamp as Record<string, unknown>).lte = new Date(to);
    }
    return this.prisma.technicianLocation.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
  }

  async getLatestByWorkOrder(workOrderId: string) {
    return this.prisma.technicianLocation.findFirst({
      where: { workOrderId },
      orderBy: { timestamp: 'desc' },
    });
  }

  async getWorkOrderOwner(workOrderId: string) {
    return this.prisma.workOrder.findUnique({
      where: { id: workOrderId },
      select: { customerId: true },
    });
  }
}
