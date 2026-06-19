import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ConflictException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateTechnicianStatusDto } from './dto/update-technician-status.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles('MODERATOR', 'TECHNICIAN')
  findAll(@Query('role') role?: string) {
    return this.usersService.findAll(role);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('MODERATOR', 'TECHNICIAN')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch('me')
  updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Post('me/password')
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.usersService.changePassword(userId, dto);
    return { message: 'Password changed successfully' };
  }

  @Patch('me/status')
  @UseGuards(RolesGuard)
  @Roles('TECHNICIAN')
  updateTechnicianStatus(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateTechnicianStatusDto,
  ) {
    return this.usersService.updateTechnicianStatus(userId, dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('MODERATOR')
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateUser(id, dto);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('MODERATOR')
  updateUserStatus(@Param('id') id: string, @Body() dto: UpdateUserStatusDto) {
    return this.usersService.updateUserStatus(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('MODERATOR')
  async deleteUser(@Param('id') id: string) {
    const canDelete = await this.usersService.canDeleteUser(id);
    if (!canDelete) {
      throw new ConflictException(
        'User has related records. Use soft ban instead.',
      );
    }
    await this.usersService.deleteUser(id);
    return { message: 'User deleted successfully' };
  }
}
