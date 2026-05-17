import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type SettingDocument = Setting & Document;

@Schema({ timestamps: true, collection: 'settings' })
export class Setting {
  @ApiProperty({ example: 'MyOfficeWiFi', description: 'SSID of the required Wi-Fi network' })
  @Prop({ default: '' })
  officeWifiSsid: string;

  @ApiProperty({ example: 'Africa/Lagos', description: 'Active server timezone' })
  @Prop({ default: 'Africa/Lagos' })
  timezone: string;
}

export const SettingSchema = SchemaFactory.createForClass(Setting);
