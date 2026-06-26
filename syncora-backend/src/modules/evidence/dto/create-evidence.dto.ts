import { IsString, IsUUID } from 'class-validator';

export class CreateEvidenceDto {
  @IsString()
  @IsUUID()
  workOrderId: string;
}
