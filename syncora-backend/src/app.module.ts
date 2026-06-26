import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { WorkOrdersModule } from './modules/work-orders/work-orders.module';
import { UsersModule } from './modules/users/users.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { WsModule } from './modules/ws/ws.module';
import { LocationModule } from './modules/locations/location.module';
import { UploadModule } from './modules/upload/upload.module';
import { EvidenceModule } from './modules/evidence/evidence.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 60,
    }]),
    PrismaModule,
    AuthModule,
    WorkOrdersModule,
    UsersModule,
    NotificationsModule,
    AnalyticsModule,
    WsModule,
    LocationModule,
    UploadModule,
    EvidenceModule,
  ],
})
export class AppModule {}
