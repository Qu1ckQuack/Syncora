import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class WorkOrderOwnershipGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const id = request.params.id;

    if (!id) return true;

    const order = await this.prisma.workOrder.findUnique({ where: { id } });

    if (!order) {
      throw new NotFoundException('Work order not found');
    }

    if (user.role === 'MODERATOR') return true;
    if (user.role === 'TECHNICIAN' && order.technicianId === user.id)
      return true;
    if (user.role === 'CUSTOMER' && order.customerId === user.id) return true;

    throw new ForbiddenException('You do not have access to this work order');
  }
}
