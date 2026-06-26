import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class WsGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(WsGateway.name);
  private readonly locationRateLimit = new Map<string, number[]>();
  private static readonly LOCATION_RATE_MAX = 1;
  private static readonly LOCATION_RATE_WINDOW = 1000;
  private rateLimitCleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {
    this.rateLimitCleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, timestamps] of this.locationRateLimit.entries()) {
        const valid = timestamps.filter(t => now - t < WsGateway.LOCATION_RATE_WINDOW);
        if (valid.length === 0) {
          this.locationRateLimit.delete(key);
        } else {
          this.locationRateLimit.set(key, valid);
        }
      }
    }, 60000);
  }

  onModuleDestroy() {
    if (this.rateLimitCleanupInterval) {
      clearInterval(this.rateLimitCleanupInterval);
      this.rateLimitCleanupInterval = null;
    }
  }

  private parseCookies(
    cookieHeader: string | undefined,
  ): Record<string, string> {
    const cookies: Record<string, string> = {};
    if (!cookieHeader) return cookies;
    for (const part of cookieHeader.split(';')) {
      const [key, ...rest] = part.trim().split('=');
      if (key) cookies[key] = rest.join('=');
    }
    return cookies;
  }

  async handleConnection(client: Socket) {
    const cookies = this.parseCookies(client.handshake.headers.cookie);
    const token = cookies['access_token'];

    if (!token) {
      this.logger.warn('Socket connection rejected: no access_token');
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token);

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { isActive: true },
      });

      if (!user || !user.isActive) {
        this.logger.warn('Socket connection rejected: user inactive or not found');
        client.disconnect();
        return;
      }

      client.data.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };
      client.join(`user:${payload.sub}`);
      client.join(`role:${payload.role}`);
      this.logger.log(`Socket connected: ${payload.email} (${payload.role})`);
    } catch {
      this.logger.warn('Socket connection rejected: invalid token');
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (user) {
      this.logger.log(`Socket disconnected: ${user.email}`);
    }
  }

  @SubscribeMessage('location.update')
  async handleLocationUpdate(
    client: Socket,
    payload: {
      workOrderId?: string;
      latitude: number;
      longitude: number;
      accuracy?: number;
    },
  ) {
    const user = client.data.user;
    if (!user || user.role !== 'TECHNICIAN') return;

    const now = Date.now();
    const userTimestamps = this.locationRateLimit.get(user.id) || [];
    const recent = userTimestamps.filter(t => now - t < WsGateway.LOCATION_RATE_WINDOW);
    if (recent.length >= WsGateway.LOCATION_RATE_MAX) {
      this.logger.warn(`Location rate limit exceeded for user ${user.id}`);
      return;
    }
    recent.push(now);
    this.locationRateLimit.set(user.id, recent);

    const location = await this.prisma.technicianLocation.create({
      data: {
        technicianId: user.id,
        workOrderId: payload.workOrderId ?? null,
        latitude: payload.latitude,
        longitude: payload.longitude,
        accuracy: payload.accuracy ?? null,
      },
    });

    this.emitToRole('HQ', 'location.update', location);

    if (payload.workOrderId) {
      const order = await this.prisma.workOrder.findUnique({
        where: { id: payload.workOrderId },
        select: { customerId: true, technicianId: true },
      });
      if (order) {
        this.emitToUser(order.customerId, 'location.update', location);
        if (order.technicianId && order.technicianId !== user.id) {
          this.emitToUser(order.technicianId, 'location.update', location);
        }
      }
    } else {
      this.emitToUser(user.id, 'location.update', location);
    }
  }

  emitToUser(userId: string, event: string, data: unknown) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  emitToRole(role: string, event: string, data: unknown) {
    this.server.to(`role:${role}`).emit(event, data);
  }

  broadcast(event: string, data: unknown) {
    this.server.emit(event, data);
  }
}
