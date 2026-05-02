import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type NotificationDocument = Notification & Document;

export enum NotificationStatus {
  READ = 'read',
  UNREAD = 'unread',
}

@Schema({ timestamps: true, collection: 'notifications' })
export class Notification {
  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @ApiProperty({ example: 'Your attendance for today has been recorded.' })
  @Prop({ required: true })
  message: string;

  @ApiProperty({ enum: NotificationStatus, default: NotificationStatus.UNREAD })
  @Prop({ enum: NotificationStatus, default: NotificationStatus.UNREAD })
  status: NotificationStatus;

  @ApiProperty({ example: 'attendance' })
  @Prop({ default: 'system' })
  type: string;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
