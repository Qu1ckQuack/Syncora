import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { WorkOrdersService } from './work-orders.service';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { AssignWorkOrderDto } from './dto/assign-work-order.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { WorkOrderOwnershipGuard } from './guards/work-order-ownership.guard';

@Controller('work-orders')
@UseGuards(JwtAuthGuard)
export class WorkOrdersController {
  constructor(private workOrdersService: WorkOrdersService) {}

  @Post()
  create(
    @Body() dto: CreateWorkOrderDto,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.workOrdersService.create(dto, user);
  }

  @Get()
  findAll(@CurrentUser() user: { id: string; role: string }) {
    return this.workOrdersService.findAll(user);
  }

  @Get(':id')
  @UseGuards(WorkOrderOwnershipGuard)
  findOne(@Param('id') id: string, @CurrentUser() user: { id: string; role: string }) {
    return this.workOrdersService.findOne(id, user);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('MODERATOR')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateWorkOrderDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.workOrdersService.update(id, dto, userId);
  }

  @Patch(':id/assign')
  @UseGuards(RolesGuard)
  @Roles('MODERATOR')
  assign(
    @Param('id') id: string,
    @Body() dto: AssignWorkOrderDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.workOrdersService.assign(id, dto, userId);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.workOrdersService.updateStatus(id, dto, user);
  }

  @Get(':id/history')
  @UseGuards(WorkOrderOwnershipGuard)
  getHistory(@Param('id') id: string) {
    return this.workOrdersService.getHistory(id);
  }
}
