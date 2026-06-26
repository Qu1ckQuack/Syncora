import { Module } from '@nestjs/common';
import { UploadModule } from '../upload/upload.module';
import { WsModule } from '../ws/ws.module';
import { EvidenceController } from './evidence.controller';
import { EvidenceService } from './evidence.service';

@Module({
  imports: [UploadModule, WsModule],
  controllers: [EvidenceController],
  providers: [EvidenceService],
})
export class EvidenceModule {}
