import { IsString, IsOptional, IsEnum } from 'class-validator';
import { Role, TechnicianStatus } from '@prisma/client';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @IsEnum(TechnicianStatus)
  @IsOptional()
  technicianStatus?: TechnicianStatus;
}
