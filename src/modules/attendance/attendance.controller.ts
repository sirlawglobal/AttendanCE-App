import {
  Controller,
  Post,
  Get,
  UseGuards,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Attendance')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('check-in')
  @ApiOperation({ summary: 'Staff check-in for today' })
  @ApiResponse({ status: 201, description: 'Check-in successful' })
  @ApiResponse({ status: 400, description: 'Already checked in today' })
  checkIn(@CurrentUser() user: any) {
    return this.attendanceService.checkIn(user._id.toString());
  }

  @Post('check-out')
  @ApiOperation({ summary: 'Staff check-out for today' })
  @ApiResponse({ status: 201, description: 'Check-out successful' })
  @ApiResponse({ status: 400, description: 'Not checked in or already checked out' })
  checkOut(@CurrentUser() user: any) {
    return this.attendanceService.checkOut(user._id.toString());
  }

  @Get('today')
  @ApiOperation({ summary: "Get today's attendance (Admin: all staff, Staff: own record)" })
  @ApiResponse({ status: 200, description: "Today's attendance records" })
  getToday(@CurrentUser() user: any) {
    const userId = user.role === Role.ADMIN ? undefined : user._id.toString();
    return this.attendanceService.getToday(userId);
  }

  @Get('history')
  @ApiOperation({ summary: "Get current user's attendance history with pagination" })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'startDate', required: false, example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', required: false, example: '2025-12-31' })
  @ApiResponse({ status: 200, description: 'Paginated attendance history' })
  getHistory(
    @CurrentUser() user: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.attendanceService.getHistory(user._id.toString(), page, limit, startDate, endDate);
  }

  @Get(':userId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: "Get a specific staff member's attendance records (Admin only)" })
  @ApiParam({ name: 'userId', description: 'MongoDB ObjectId of the staff member' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'Paginated attendance records for the user' })
  getByUserId(
    @Param('userId') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.attendanceService.getByUserId(userId, page, limit);
  }
}
