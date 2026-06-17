import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { LocationService } from './location.service';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../modules/auth/guards/roles.guard';
import { Roles } from '../../modules/auth/decorators/roles.decorator';

@Controller('locations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LocationController {
  constructor(private locationService: LocationService) {}

  @Get('technician/:id')
  @Roles('MODERATOR', 'TECHNICIAN')
  async getTechnicianLatest(@Param('id') id: string) {
    return this.locationService.getLatestByTechnician(id);
  }

  @Get('technician/:id/history')
  @Roles('MODERATOR', 'TECHNICIAN')
  async getTechnicianHistory(
    @Param('id') id: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.locationService.getHistoryByTechnician(id, from, to);
  }

  @Get('work-order/:id')
  @Roles('MODERATOR', 'TECHNICIAN', 'CUSTOMER')
  async getWorkOrderLocations(@Param('id') id: string) {
    return this.locationService.getLatestByWorkOrder(id);
  }
}
