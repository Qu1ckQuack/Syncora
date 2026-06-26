import { Controller, Get, Param, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { LocationService } from './location.service';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../modules/auth/guards/roles.guard';
import { Roles } from '../../modules/auth/decorators/roles.decorator';
import { CurrentUser } from '../../modules/auth/decorators/current-user.decorator';

@Controller('locations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LocationController {
  constructor(private locationService: LocationService) {}

  @Get('technicians')
  @Roles('HQ', 'DEALER', 'TECHNICIAN')
  async getAllTechniciansWithLocation() {
    return this.locationService.getAllTechniciansWithLatestLocation();
  }

  @Get('technician/:id')
  @Roles('HQ')
  async getTechnicianLatest(@Param('id') id: string, @CurrentUser() user: { id: string; role: string }) {
    if (user.role !== 'HQ' && user.id !== id) {
      throw new ForbiddenException('Access denied');
    }
    return this.locationService.getLatestByTechnician(id);
  }

  @Get('technician/:id/history')
  @Roles('HQ')
  async getTechnicianHistory(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: string },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    if (user.role !== 'HQ' && user.id !== id) {
      throw new ForbiddenException('Access denied');
    }
    return this.locationService.getHistoryByTechnician(id, from, to);
  }

  @Get('work-order/:id')
  @Roles('HQ', 'TECHNICIAN', 'CUSTOMER', 'DEALER')
  async getWorkOrderLocations(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    if (user.role === 'CUSTOMER') {
      const order = await this.locationService.getWorkOrderOwner(id);
      if (order?.customerId !== user.id) {
        throw new ForbiddenException('Access denied');
      }
    }
    return this.locationService.getLatestByWorkOrder(id);
  }
}
