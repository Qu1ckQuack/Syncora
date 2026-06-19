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
import { Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  // Hardcoded: Make token expiry configurable via env (JWT_ACCESS_EXPIRY / JWT_REFRESH_EXPIRY)
  private readonly ACCESS_TOKEN_EXPIRY = 15 * 60 * 1000;
  private readonly REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000;

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
        // Hardcoded: Make configurable via env (JWT_ACCESS_EXPIRY)
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
        expiresAt: new Date(Date.now() + this.REFRESH_TOKEN_EXPIRY),
      },
    });

    return token;
  }

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api',
      maxAge: this.ACCESS_TOKEN_EXPIRY,
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth',
      maxAge: this.REFRESH_TOKEN_EXPIRY,
    });
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie('access_token', { path: '/api' });
    res.clearCookie('refresh_token', { path: '/api/auth' });
  }

  async register(dto: RegisterDto, res: Response) {
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
    this.setAuthCookies(res, accessToken, refreshToken);

    this.logger.log(`User registered: ${user.email}`);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  async login(dto: LoginDto, res: Response) {
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
    this.setAuthCookies(res, accessToken, refreshToken);

    this.logger.log(`User logged in: ${user.email}`);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  async refresh(refreshTokenStr: string, res: Response) {
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

    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true, replacedByToken: 'rotated' },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: storedToken.userId },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const accessToken = this.generateAccessToken(user);
    const newRefreshToken = await this.generateRefreshToken(user.id);
    this.setAuthCookies(res, accessToken, newRefreshToken);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  async logout(userId: string, refreshTokenStr: string, res: Response) {
    if (refreshTokenStr) {
      const hashed = this.hashToken(refreshTokenStr);
      await this.prisma.refreshToken.updateMany({
        where: { token: hashed, userId },
        data: { revoked: true },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        action: 'LOGOUT',
        entityType: 'USER',
        entityId: userId,
        userId,
      },
    });

    this.clearAuthCookies(res);
    this.logger.log(`User logged out: ${userId}`);
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
