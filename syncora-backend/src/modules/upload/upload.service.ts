// Hardcoded (external service): Avatar upload via AWS S3
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class UploadService implements OnModuleInit {
  private readonly logger = new Logger(UploadService.name);
  private s3!: S3Client;
  private bucket!: string;
  private region!: string;

  onModuleInit() {
    this.region = process.env.AWS_REGION || 'us-east-1';
    this.bucket = process.env.S3_BUCKET_NAME || 'syncora-avatars';
    this.s3 = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
      },
    });
  }

  async uploadAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<string> {
    const ext = file.mimetype.split('/')[1] ?? 'png';
    const key = `avatars/${userId}-${Date.now()}.${ext}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    this.logger.log(`Avatar uploaded: s3://${this.bucket}/${key}`);

    const url = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
    return url;
  }

  async uploadEvidence(
    workOrderId: string,
    technicianId: string,
    file: Express.Multer.File,
  ): Promise<string> {
    const ext = file.mimetype.split('/')[1] ?? 'bin';
    const key = `evidence/${workOrderId}/${technicianId}-${Date.now()}.${ext}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    this.logger.log(`Evidence uploaded: s3://${this.bucket}/${key}`);

    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }
}
