import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getOverviewStats(user: { id: string; role: string }) {
    const where =
      user.role === 'HQ'
        ? {}
        : user.role === 'TECHNICIAN'
          ? { technicianId: user.id }
          : { customerId: user.id };

    const [orders, unreadAlerts] = await Promise.all([
      this.prisma.workOrder.findMany({
        where,
        select: { status: true, priority: true, actualStart: true, actualEnd: true },
      }),
      this.prisma.notification.count({
        where: { userId: user.id, read: false },
      }),
    ]);

    const totalOrders = orders.length;
    const byStatus: Record<string, number> = {};
    let pendingUrgent = 0;
    let completedCount = 0;
    let totalCompletionHours = 0;
    let completionTimeCount = 0;
    let nonCancelledCount = 0;

    for (const order of orders) {
      byStatus[order.status] = (byStatus[order.status] || 0) + 1;
      if (order.priority === 'URGENT' && order.status !== 'COMPLETED' && order.status !== 'CANCELLED') {
        pendingUrgent++;
      }
      if (order.status !== 'CANCELLED') nonCancelledCount++;
      if (order.status === 'COMPLETED') {
        completedCount++;
        if (order.actualStart && order.actualEnd) {
          const hours =
            (order.actualEnd.getTime() - order.actualStart.getTime()) / (1000 * 60 * 60);
          totalCompletionHours += hours;
          completionTimeCount++;
        }
      }
    }

    const completionRate =
      nonCancelledCount > 0 ? Math.round((completedCount / nonCancelledCount) * 100) : 0;
    const avgCompletionHours =
      completionTimeCount > 0
        ? Math.round((totalCompletionHours / completionTimeCount) * 10) / 10
        : null;

    return {
      totalOrders,
      byStatus,
      pendingUrgent,
      completionRate,
      avgCompletionHours,
      unreadAlerts,
    };
  }

  async getCompletionTrend(
    days: number,
    period: string,
    user: { id: string; role: string },
  ) {
    const whereBase =
      user.role === 'HQ'
        ? {}
        : user.role === 'TECHNICIAN'
          ? { technicianId: user.id }
          : { customerId: user.id };

    const since = new Date();
    since.setDate(since.getDate() - days);

    const orders = await this.prisma.workOrder.findMany({
      where: {
        ...whereBase,
        status: 'COMPLETED',
        updatedAt: { gte: since },
      },
      select: { updatedAt: true },
      orderBy: { updatedAt: 'asc' },
    });

    const grouped: Record<string, number> = {};
    for (const order of orders) {
      const date = new Date(order.updatedAt);
      let key: string;
      if (period === 'weekly') {
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        key = startOfWeek.toISOString().split('T')[0];
      } else {
        key = date.toISOString().split('T')[0];
      }
      grouped[key] = (grouped[key] || 0) + 1;
    }

    return Object.entries(grouped)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async getTechnicianPerformance() {
    const technicians = await this.prisma.user.findMany({
      where: { role: 'TECHNICIAN', isActive: true },
      select: {
        id: true,
        name: true,
        workOrdersAsTechnician: {
          select: {
            status: true,
            actualStart: true,
            actualEnd: true,
          },
        },
      },
    });

    return technicians
      .map((tech) => {
        const completed = tech.workOrdersAsTechnician.filter(
          (o) => o.status === 'COMPLETED',
        );
        const activeOrders = tech.workOrdersAsTechnician.filter(
          (o) => o.status === 'IN_PROGRESS' || o.status === 'EN_ROUTE',
        ).length;

        let totalHours = 0;
        let countWithTime = 0;
        for (const order of completed) {
          if (order.actualStart && order.actualEnd) {
            totalHours +=
              (order.actualEnd.getTime() - order.actualStart.getTime()) /
              (1000 * 60 * 60);
            countWithTime++;
          }
        }

        return {
          technicianId: tech.id,
          name: tech.name,
          completed: completed.length,
          avgTimeHours:
            countWithTime > 0
              ? Math.round((totalHours / countWithTime) * 10) / 10
              : null,
          activeOrders,
        };
      })
      .sort((a, b) => b.completed - a.completed);
  }

  async getAlertFrequency(days: number) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const notifications = await this.prisma.notification.groupBy({
      by: ['type'],
      where: { createdAt: { gte: since } },
      _count: { type: true },
    });

    return notifications.map((n) => ({
      type: n.type,
      count: n._count.type,
    }));
  }
}
