import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type AttendanceDocument = Attendance & Document;

export enum AttendanceStatus {
  PRESENT = 'present',
  LATE = 'late',
  ABSENT = 'absent',
}

@Schema({ timestamps: true, collection: 'attendance' })
export class Attendance {
  @ApiProperty({ description: 'Reference to the user' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @ApiProperty({ description: 'Check-in timestamp' })
  @Prop()
  checkInTime: Date;

  @ApiProperty({ description: 'Check-out timestamp' })
  @Prop()
  checkOutTime: Date;

  @ApiProperty({ enum: AttendanceStatus })
  @Prop({ enum: AttendanceStatus, default: AttendanceStatus.PRESENT })
  status: AttendanceStatus;

  @ApiProperty({ description: 'Date of attendance (YYYY-MM-DD)' })
  @Prop({ required: true, index: true })
  date: string;

  @ApiProperty({ description: 'Notes or remarks' })
  @Prop()
  notes: string;
}

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);

AttendanceSchema.index({ userId: 1, date: 1 }, { unique: true });
