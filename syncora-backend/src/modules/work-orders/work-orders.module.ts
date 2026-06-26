import { Module } from '@nestjs/common';
import { WorkOrdersController } from './work-orders.controller';
import { WorkOrdersService } from './work-orders.service';
import { WorkOrderEventsService } from './work-order-events.service';
import { WorkOrderOwnershipGuard } from './guards/work-order-ownership.guard';
import { GeocodingService } from '../../common/geocoding.service';
import { WsModule } from '../ws/ws.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [WsModule, NotificationsModule],
  controllers: [WorkOrdersController],
  providers: [
    WorkOrdersService,
    WorkOrderEventsService,
    GeocodingService,
    WorkOrderOwnershipGuard,
  ],
  exports: [WorkOrdersService],
})
export class WorkOrdersModule {}
