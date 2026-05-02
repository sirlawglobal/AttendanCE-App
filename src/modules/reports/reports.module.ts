import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Attendance, AttendanceSchema } from '../attendance/schemas/attendance.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Attendance.name, schema: AttendanceSchema }])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
