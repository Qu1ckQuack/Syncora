import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, createHash } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private generateAccessToken(user: {
    id: string;
    email: string;
    role: string;
  }): string {
    return this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '15m',
      },
    );
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    const token = randomBytes(40).toString('hex');
    const hashed = this.hashToken(token);

    await this.prisma.refreshToken.create({
      data: {
        token: hashed,
        userId,
        expiresAt: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ),
      },
    });

    return token;
  }

  private sanitizeUser(user: {
    id: string;
    email: string;
    name: string;
    role: string;
    technicianStatus?: string | null;
    avatarUrl?: string | null;
    createdAt?: Date;
  }) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      ...(user.technicianStatus !== undefined
        ? { technicianStatus: user.technicianStatus }
        : {}),
      ...(user.avatarUrl !== undefined
        ? { avatarUrl: user.avatarUrl }
        : {}),
      ...(user.createdAt !== undefined
        ? { createdAt: user.createdAt }
        : {}),
    };
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'USER_REGISTERED',
        entityType: 'USER',
        entityId: user.id,
        userId: user.id,
      },
    });

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user.id);

    this.logger.log(`User registered: ${user.email}`);
    return { user: this.sanitizeUser(user), accessToken, refreshToken };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.auditLog.create({
      data: {
        action: 'LOGIN',
        entityType: 'USER',
        entityId: user.id,
        userId: user.id,
      },
    });

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user.id);

    this.logger.log(`User logged in: ${user.email}`);
    return { user: this.sanitizeUser(user), accessToken, refreshToken };
  }

  async refresh(refreshTokenStr: string) {
    if (!refreshTokenStr) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const hashed = this.hashToken(refreshTokenStr);
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: hashed },
    });

    if (
      !storedToken ||
      storedToken.revoked ||
      storedToken.expiresAt < new Date()
    ) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: storedToken.userId },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const rawToken = randomBytes(40).toString('hex');
    const hashedNewToken = this.hashToken(rawToken);

    await this.prisma.$transaction(async (tx) => {
      await tx.refreshToken.update({
        where: { id: storedToken.id },
        data: { revoked: true, replacedByToken: hashedNewToken },
      });

      await tx.refreshToken.create({
        data: {
          token: hashedNewToken,
          userId: user.id,
          expiresAt: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
          ),
        },
      });
    });

    const accessToken = this.generateAccessToken(user);
    return { user: this.sanitizeUser(user), accessToken, refreshToken: rawToken };
  }

  async logout(refreshTokenStr: string | undefined) {
    let userId: string | null = null;

    if (refreshTokenStr) {
      const hashed = this.hashToken(refreshTokenStr);
      const stored = await this.prisma.refreshToken.findUnique({
        where: { token: hashed },
      });
      if (stored) {
        userId = stored.userId;
        await this.prisma.refreshToken.update({
          where: { id: stored.id },
          data: { revoked: true },
        });
      }
    }

    if (userId) {
      await this.prisma.auditLog.create({
        data: {
          action: 'LOGOUT',
          entityType: 'USER',
          entityId: userId,
          userId,
        },
      });
      this.logger.log(`User logged out: ${userId}`);
    }

    return { message: 'Logged out successfully' };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
