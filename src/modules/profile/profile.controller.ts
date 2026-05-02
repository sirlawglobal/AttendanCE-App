import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Profile')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile data' })
  getProfile(@CurrentUser() user: any) {
    return this.profileService.getProfile(user._id.toString());
  }

  @Patch()
  @ApiOperation({ summary: 'Update current user profile (name and department)' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  updateProfile(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    return this.profileService.updateProfile(user._id.toString(), dto);
  }

  @Patch('password')
  @ApiOperation({ summary: 'Change current user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Current password is incorrect' })
  changePassword(@CurrentUser() user: any, @Body() dto: ChangePasswordDto) {
    return this.profileService.changePassword(user._id.toString(), dto);
  }
}
