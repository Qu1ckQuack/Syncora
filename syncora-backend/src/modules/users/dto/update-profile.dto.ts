import { IsString, IsOptional, IsEnum } from 'class-validator';
import { TechnicianStatus } from '@prisma/client';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;
}
