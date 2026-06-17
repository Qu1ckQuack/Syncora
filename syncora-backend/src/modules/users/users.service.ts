import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(role?: string) {
    const where = role ? { role: role as any } : {};
    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        technicianStatus: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        _count: { select: { workOrdersAsTechnician: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        technicianStatus: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            workOrdersAsTechnician: true,
            workOrdersAsCustomer: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
