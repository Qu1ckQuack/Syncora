import { IsEnum } from 'class-validator';
import { TechnicianStatus } from '@prisma/client';

export class UpdateTechnicianStatusDto {
  @IsEnum(TechnicianStatus)
  technicianStatus: TechnicianStatus;
}
