import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPassword@123', description: 'Current password' })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ example: 'NewPassword@456', description: 'New password (min 6 chars)', minLength: 6 })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  newPassword: string;
}
