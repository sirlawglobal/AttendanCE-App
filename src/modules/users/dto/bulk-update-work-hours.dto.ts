import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class BulkUpdateWorkHoursDto {
  @ApiProperty({ example: '09:00', description: 'Work start time in HH:mm format' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Time must be in HH:mm format' })
  workStartTime: string;

  @ApiProperty({ example: '17:00', description: 'Work end time in HH:mm format' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Time must be in HH:mm format' })
  workEndTime: string;
}
