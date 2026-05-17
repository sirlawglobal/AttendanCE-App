import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Attendance, AttendanceDocument, AttendanceStatus } from './schemas/attendance.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectModel(Attendance.name) private attendanceModel: Model<AttendanceDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  private getStatus(checkInTime: Date, workStartTime: string = '09:00'): AttendanceStatus {
    const [startHour, startMinute] = workStartTime.split(':').map(Number);
    // Add 30 minutes grace period
    const graceMinutes = 30;
    
    let thresholdHour = startHour;
    let thresholdMinute = startMinute + graceMinutes;
    if (thresholdMinute >= 60) {
      thresholdHour += 1;
      thresholdMinute -= 60;
    }

    const hour = checkInTime.getHours();
    const minute = checkInTime.getMinutes();
    
    if (
      hour > thresholdHour ||
      (hour === thresholdHour && minute > thresholdMinute)
    ) {
      return AttendanceStatus.LATE;
    }
    return AttendanceStatus.PRESENT;
  }

  async checkIn(userId: string): Promise<Attendance> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const today = this.getTodayDate();

    const existing = await this.attendanceModel.findOne({
      userId: new Types.ObjectId(userId),
      date: today,
    });

    if (existing) {
      throw new BadRequestException('You have already checked in today');
    }

    const checkInTime = new Date();
    const status = this.getStatus(checkInTime, user.workStartTime);

    const attendance = new this.attendanceModel({
      userId: new Types.ObjectId(userId),
      checkInTime,
      date: today,
      status,
    });

    return attendance.save();
  }

  async checkOut(userId: string): Promise<Attendance> {
    const today = this.getTodayDate();

    const attendance = await this.attendanceModel.findOne({
      userId: new Types.ObjectId(userId),
      date: today,
    });

    if (!attendance) {
      throw new BadRequestException('You have not checked in today');
    }

    if (attendance.checkOutTime) {
      throw new BadRequestException('You have already checked out today');
    }

    attendance.checkOutTime = new Date();
    return attendance.save();
  }

  async getToday(userId?: string): Promise<Attendance[]> {
    const today = this.getTodayDate();
    const query: any = { date: today };

    if (userId) {
      query.userId = new Types.ObjectId(userId);
    }

    return this.attendanceModel
      .find(query)
      .populate('userId', 'name email department')
      .lean();
  }

  async getHistory(
    userId: string,
    page = 1,
    limit = 10,
    startDate?: string,
    endDate?: string,
  ) {
    const skip = (page - 1) * limit;
    const query: any = { userId: new Types.ObjectId(userId) };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date['$gte'] = startDate;
      if (endDate) query.date['$lte'] = endDate;
    }

    const [data, total] = await Promise.all([
      this.attendanceModel
        .find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.attendanceModel.countDocuments(query),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getByUserId(
    userId: string,
    page = 1,
    limit = 10,
  ) {
    const skip = (page - 1) * limit;
    const query = { userId: new Types.ObjectId(userId) };

    const [data, total] = await Promise.all([
      this.attendanceModel
        .find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.attendanceModel.countDocuments(query),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getAttendanceByDateRange(startDate: string, endDate: string): Promise<Attendance[]> {
    return this.attendanceModel
      .find({ date: { $gte: startDate, $lte: endDate } })
      .populate('userId', 'name email department')
      .sort({ date: -1 })
      .lean();
  }

  async getTodayStats() {
    const today = this.getTodayDate();
    const stats = await this.attendanceModel.aggregate([
      { $match: { date: today } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const result: Record<string, number> = { present: 0, late: 0, absent: 0 };
    stats.forEach((s) => { result[s._id] = s.count; });
    return result;
  }
}
