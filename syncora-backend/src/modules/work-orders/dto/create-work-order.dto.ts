import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { Priority } from '@prisma/client';

export class CreateWorkOrderDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @IsUUID()
  customerId: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  scheduledStart?: string;

  @IsString()
  @IsOptional()
  scheduledEnd?: string;

  @IsOptional()
  latitude?: number;

  @IsOptional()
  longitude?: number;
}
