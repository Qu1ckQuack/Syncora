import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateTechnicianStatusDto } from './dto/update-technician-status.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(role?: string) {
    const where = role ? { role: role as Role } : {};
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

  async updateProfile(id: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        technicianStatus: true,
        avatarUrl: true,
        createdAt: true,
      },
    });
  }

  async changePassword(id: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('Current password is incorrect');

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }

  async updateTechnicianStatus(id: string, dto: UpdateTechnicianStatusDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id },
      data: { technicianStatus: dto.technicianStatus },
      select: {
        id: true,
        name: true,
        technicianStatus: true,
      },
    });
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.role !== undefined && { role: dto.role }),
        ...(dto.technicianStatus !== undefined && {
          technicianStatus: dto.technicianStatus,
        }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        technicianStatus: true,
        isActive: true,
      },
    });
  }

  async updateUserStatus(id: string, dto: UpdateUserStatusDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id },
      data: { isActive: dto.isActive },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });
  }

  async deleteUser(id: string) {
    await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id } });
      if (!user) throw new NotFoundException('User not found');

      const [workOrders, audits, notifications, refreshTokens] =
        await Promise.all([
          tx.workOrder.count({
            where: {
              OR: [{ customerId: id }, { technicianId: id }],
            },
          }),
          tx.auditLog.count({ where: { userId: id } }),
          tx.notification.count({ where: { userId: id } }),
          tx.refreshToken.count({ where: { userId: id } }),
        ]);

      const hasRelated =
        workOrders > 0 || audits > 0 || notifications > 0 || refreshTokens > 0;
      if (hasRelated) {
        throw new ConflictException(
          'User has related records. Use soft ban instead.',
        );
      }

      await tx.user.delete({ where: { id } });
    });
  }
}
