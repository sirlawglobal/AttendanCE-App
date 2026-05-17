import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Setting, SettingDocument } from './schemas/setting.schema';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(
    @InjectModel(Setting.name) private settingModel: Model<SettingDocument>,
  ) {}

  async onModuleInit() {
    const settings = await this.settingModel.findOne();
    if (!settings) {
      const defaultTimezone = process.env['TZ'] || 'Africa/Lagos';
      await this.settingModel.create({
        officeWifiSsid: process.env['OFFICE_WIFI_SSID'] || '',
        timezone: defaultTimezone,
      });
      process.env.TZ = defaultTimezone;
    } else {
      process.env.TZ = settings.timezone || 'Africa/Lagos';
    }
  }

  async getSettings(): Promise<Setting> {
    let settings = await this.settingModel.findOne().lean();
    if (!settings) {
      const defaultTimezone = process.env['TZ'] || 'Africa/Lagos';
      const newSettings = await this.settingModel.create({
        officeWifiSsid: process.env['OFFICE_WIFI_SSID'] || '',
        timezone: defaultTimezone,
      });
      process.env.TZ = defaultTimezone;
      settings = newSettings.toObject();
    }
    return settings;
  }

  async updateSettings(updateDto: UpdateSettingsDto): Promise<Setting> {
    let settings = await this.settingModel.findOne();
    if (!settings) {
      settings = new this.settingModel(updateDto);
      if (updateDto.timezone) {
        process.env.TZ = updateDto.timezone;
      }
      return settings.save();
    }
    
    if (updateDto.officeWifiSsid !== undefined) {
      settings.officeWifiSsid = updateDto.officeWifiSsid;
    }

    if (updateDto.timezone !== undefined) {
      settings.timezone = updateDto.timezone;
      process.env.TZ = updateDto.timezone; // Apply timezone change dynamically at runtime
    }
    
    return settings.save();
  }
}
