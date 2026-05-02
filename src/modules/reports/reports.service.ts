import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Attendance, AttendanceDocument } from '../attendance/schemas/attendance.schema';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Attendance.name) private attendanceModel: Model<AttendanceDocument>,
  ) {}

  async getAttendanceReport(startDate: string, endDate: string, page = 1, limit = 50) {
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate query parameters are required');
    }

    if (startDate > endDate) {
      throw new BadRequestException('startDate must be before or equal to endDate');
    }

    const skip = (page - 1) * limit;
    const query = { date: { $gte: startDate, $lte: endDate } };

    const [data, total] = await Promise.all([
      this.attendanceModel
        .find(query)
        .populate('userId', 'name email department')
        .sort({ date: -1, checkInTime: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.attendanceModel.countDocuments(query),
    ]);

    const summary = await this.attendanceModel.aggregate([
      { $match: query },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const summaryMap: Record<string, number> = { present: 0, late: 0, absent: 0 };
    summary.forEach((s) => { summaryMap[s._id] = s.count; });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary: summaryMap,
      dateRange: { startDate, endDate },
    };
  }

  async exportAttendanceCsv(startDate: string, endDate: string): Promise<string> {
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate query parameters are required');
    }

    const records = await this.attendanceModel
      .find({ date: { $gte: startDate, $lte: endDate } })
      .populate('userId', 'name email department')
      .sort({ date: -1 })
      .lean();

    const headers = ['Date', 'Name', 'Email', 'Department', 'Check In', 'Check Out', 'Status'];

    const rows = records.map((r) => {
      const user = r.userId as any;
      return [
        r.date,
        user?.name || '',
        user?.email || '',
        user?.department || '',
        r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString() : '',
        r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString() : '',
        r.status,
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }
}
