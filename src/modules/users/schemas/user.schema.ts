import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../../common/enums/role.enum';

export type UserDocument = User & Document;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  _id: Types.ObjectId;

  @ApiProperty({ example: 'John Doe' })
  @Prop({ required: true, trim: true })
  name: string;

  @ApiProperty({ example: 'john@company.com' })
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @ApiProperty({ enum: Role, example: Role.STAFF })
  @Prop({ required: true, enum: Role, default: Role.STAFF })
  role: Role;

  @ApiProperty({ example: 'Engineering' })
  @Prop({ trim: true })
  department: string;

  @ApiProperty({ example: true })
  @Prop({ default: true })
  isActive: boolean;

  @ApiProperty({ example: '09:00', description: 'Work start time in HH:mm format' })
  @Prop({ default: '09:00', trim: true })
  workStartTime: string;

  @ApiProperty({ example: '17:00', description: 'Work end time in HH:mm format' })
  @Prop({ default: '17:00', trim: true })
  workEndTime: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
