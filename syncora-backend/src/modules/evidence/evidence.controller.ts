import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateEvidenceDto } from './dto/create-evidence.dto';
import { EvidenceService } from './evidence.service';

type AuthUser = { id: string; role: string };

@Controller()
@UseGuards(JwtAuthGuard)
export class EvidenceController {
  constructor(private evidenceService: EvidenceService) {}

  @Post('evidence')
  @UseGuards(RolesGuard)
  @Roles('TECHNICIAN')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 25 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/') && !file.mimetype.startsWith('video/')) {
          cb(new BadRequestException('Only image and video files are allowed'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  create(
    @Body() dto: CreateEvidenceDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthUser,
  ) {
    return this.evidenceService.create(dto.workOrderId, file, user);
  }

  @Get('work-orders/:id/evidence')
  findForWorkOrder(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.evidenceService.findForWorkOrder(id, user);
  }
}
