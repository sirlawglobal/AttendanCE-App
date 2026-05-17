import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { SettingsService } from '../settings/settings.service';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ipRangeCheck = require('ip-range-check') as (addr: string, range: string | string[]) => boolean;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly settingsService: SettingsService,
  ) {}

  async login(loginDto: LoginDto, clientIp: string) {
    const user = await this.usersService.findByEmail(loginDto.email, true);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account has been deactivated. Contact your administrator.');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.role !== 'admin') {
      const settings = await this.settingsService.getSettings();
      const officeWifiSsid = settings.officeWifiSsid;
      
      // If a required Wi-Fi SSID is configured, strict check the app payload
      if (officeWifiSsid && officeWifiSsid !== '') {
        if (!loginDto.wifiSsid || loginDto.wifiSsid !== officeWifiSsid) {
          throw new UnauthorizedException(`Access denied: You must be connected to the office Wi-Fi (${officeWifiSsid})`);
        }
      } else {
        // Fallback to IP address checking if Wi-Fi SSID is not configured
        const allowedIps = this.configService.get<string[]>('officeIpRanges') || [];
        if (allowedIps.length > 0) {
          let isAllowed = false;
          try {
            isAllowed = ipRangeCheck(clientIp, allowedIps);
          } catch (e) {
            console.error('Error checking IP range', e);
          }
          if (!isAllowed) {
            throw new UnauthorizedException('Access denied: Not connected to office network');
          }
        }
      }
    }

    const payload = { sub: user._id.toString(), email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      token_type: 'Bearer',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    };
  }

  async getMe(userId: string) {
    return this.usersService.findOne(userId);
  }
}
