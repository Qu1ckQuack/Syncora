import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../../prisma/prisma.service';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@WebSocketGateway({
  cors: {
    // Hardcoded: Remove fallback in production — FRONTEND_URL must be set in env
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class WsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(WsGateway.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  private parseCookies(cookieHeader: string | undefined): Record<string, string> {
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
      this.logger.warn(`Socket connection rejected: no access_token`);
      client.disconnect();
      return;
    }

    try {
      // Hardcoded: Remove fallback in production — JWT_SECRET must be set in env
      const secret = this.configService.get<string>('JWT_SECRET', 'dev-jwt-secret');
      const payload = jwt.verify(token, secret) as JwtPayload;
      client.data.user = { id: payload.sub, email: payload.email, role: payload.role };
      client.join(`user:${payload.sub}`);
      client.join(`role:${payload.role}`);
      this.logger.log(`Socket connected: ${payload.email} (${payload.role})`);
    } catch {
      this.logger.warn(`Socket connection rejected: invalid token`);
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
    payload: { workOrderId?: string; latitude: number; longitude: number; accuracy?: number },
  ) {
    const user = client.data.user;
    if (!user || user.role !== 'TECHNICIAN') return;

    const location = await this.prisma.technicianLocation.create({
      data: {
        technicianId: user.id,
        workOrderId: payload.workOrderId ?? null,
        latitude: payload.latitude,
        longitude: payload.longitude,
        accuracy: payload.accuracy ?? null,
      },
    });

    this.broadcast('location.update', location);

    if (payload.workOrderId) {
      const order = await this.prisma.workOrder.findUnique({
        where: { id: payload.workOrderId },
        select: { customerId: true },
      });
      if (order) {
        this.emitToUser(order.customerId, 'location.update', location);
      }
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
