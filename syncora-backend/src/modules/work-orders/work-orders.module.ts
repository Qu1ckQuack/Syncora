import { Module } from '@nestjs/common';
import { WorkOrdersController } from './work-orders.controller';
import { WorkOrdersService } from './work-orders.service';
import { WorkOrderOwnershipGuard } from './guards/work-order-ownership.guard';
import { WsModule } from '../ws/ws.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [WsModule, NotificationsModule],
  controllers: [WorkOrdersController],
  providers: [WorkOrdersService, WorkOrderOwnershipGuard],
  exports: [WorkOrdersService],
})
export class WorkOrdersModule {}
