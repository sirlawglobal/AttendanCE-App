import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Dashboard')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get daily attendance summary (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Summary including total staff, present, absent, and late counts',
    schema: {
      example: {
        totalStaff: 20,
        activeStaff: 18,
        presentToday: 12,
        lateToday: 3,
        absentToday: 3,
        checkedInToday: 15,
        date: '2025-05-02',
      },
    },
  })
  getSummary() {
    return this.dashboardService.getSummary();
  }

  @Get('attendance-stats')
  @ApiOperation({ summary: 'Get attendance statistics with weekly trends (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Weekly attendance stats, department breakdown, and today status breakdown',
  })
  getAttendanceStats() {
    return this.dashboardService.getAttendanceStats();
  }
}
