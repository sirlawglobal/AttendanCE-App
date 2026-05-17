import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateSettingsDto {
  @ApiPropertyOptional({ example: 'MyOfficeWiFi' })
  @IsString()
  @IsOptional()
  officeWifiSsid?: string;

  @ApiPropertyOptional({ example: 'Africa/Lagos' })
  @IsString()
  @IsOptional()
  timezone?: string;
}
