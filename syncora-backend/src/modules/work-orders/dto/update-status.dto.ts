import { IsEnum, IsOptional, IsString } from 'class-validator';
import { WorkOrderStatus } from '@prisma/client';

export class UpdateStatusDto {
  @IsEnum(WorkOrderStatus)
  status: WorkOrderStatus;

  @IsString()
  @IsOptional()
  note?: string;
}
