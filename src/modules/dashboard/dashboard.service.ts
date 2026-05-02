import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Attendance, AttendanceDocument, AttendanceStatus } from '../attendance/schemas/attendance.schema';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Attendance.name) private attendanceModel: Model<AttendanceDocument>,
  ) {}

  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  async getSummary() {
    const today = this.getTodayDate();

    const [
      totalStaff,
      activeStaff,
      todayAttendance,
      presentCount,
      lateCount,
    ] = await Promise.all([
      this.userModel.countDocuments({ role: Role.STAFF }),
      this.userModel.countDocuments({ role: Role.STAFF, isActive: true }),
      this.attendanceModel.countDocuments({ date: today }),
      this.attendanceModel.countDocuments({ date: today, status: AttendanceStatus.PRESENT }),
      this.attendanceModel.countDocuments({ date: today, status: AttendanceStatus.LATE }),
    ]);

    const absentCount = activeStaff - todayAttendance;

    return {
      totalStaff,
      activeStaff,
      presentToday: presentCount,
      lateToday: lateCount,
      absentToday: absentCount < 0 ? 0 : absentCount,
      checkedInToday: todayAttendance,
      date: today,
    };
  }

  async getAttendanceStats() {
    const today = new Date();
    const last7Days: string[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      last7Days.push(d.toISOString().split('T')[0]);
    }

    const stats = await this.attendanceModel.aggregate([
      { $match: { date: { $in: last7Days } } },
      {
        $group: {
          _id: { date: '$date', status: '$status' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]);

    const grouped: Record<string, Record<string, number>> = {};
    last7Days.forEach((d) => {
      grouped[d] = { present: 0, late: 0, absent: 0 };
    });

    stats.forEach((s) => {
      if (grouped[s._id.date]) {
        grouped[s._id.date][s._id.status] = s.count;
      }
    });

    const weeklyStats = last7Days.map((date) => ({
      date,
      ...grouped[date],
    }));

    const departmentStats = await this.userModel.aggregate([
      { $match: { role: Role.STAFF } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const statusBreakdown = await this.attendanceModel.aggregate([
      { $match: { date: this.getTodayDate() } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const statusMap: Record<string, number> = { present: 0, late: 0, absent: 0 };
    statusBreakdown.forEach((s) => { statusMap[s._id] = s.count; });

    return {
      weeklyStats,
      departmentStats: departmentStats.map((d) => ({
        department: d._id || 'Unknown',
        count: d.count,
      })),
      todayStatusBreakdown: statusMap,
    };
  }
}
