import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('overview')
  getOverview(@CurrentUser() user: { id: string; role: string }) {
    return this.analyticsService.getOverviewStats(user);
  }

  @Get('trends/completion')
  getCompletionTrend(
    @CurrentUser() user: { id: string; role: string },
    @Query('days') days?: string,
    @Query('period') period?: string,
  ) {
    const parsed = parseInt(days || '30', 10);
    const safeDays = isNaN(parsed) ? 30 : Math.min(parsed, 365);
    return this.analyticsService.getCompletionTrend(
      safeDays,
      period || 'daily',
      user,
    );
  }

  @Get('technicians')
  @UseGuards(RolesGuard)
  @Roles('MODERATOR')
  getTechnicianPerformance() {
    return this.analyticsService.getTechnicianPerformance();
  }

  @Get('alerts')
  @UseGuards(RolesGuard)
  @Roles('MODERATOR')
  getAlertFrequency(@Query('days') days?: string) {
    const parsed = parseInt(days || '30', 10);
    const safeDays = isNaN(parsed) ? 30 : Math.min(parsed, 365);
    return this.analyticsService.getAlertFrequency(safeDays);
  }
}
