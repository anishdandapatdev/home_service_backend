import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(private readonly configService: ConfigService) {}

  async uploadFile(file: Express.Multer.File, folder = 'general'): Promise<string> {
    const bucket = this.configService.get<string>('S3_BUCKET') || 'home-maintenance-assets';
    const region = this.configService.get<string>('S3_REGION') || 'ap-south-1';

    const filename = `${folder}/${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const fileUrl = `https://${bucket}.s3.${region}.amazonaws.com/${filename}`;

    this.logger.log(`Mock S3 Upload successful: ${fileUrl} (size: ${file.size} bytes)`);
    return fileUrl;
  }

  async getPresignedUploadUrl(filename: string, folder = 'general'): Promise<{ uploadUrl: string; fileUrl: string }> {
    const bucket = this.configService.get<string>('S3_BUCKET') || 'home-maintenance-assets';
    const region = this.configService.get<string>('S3_REGION') || 'ap-south-1';

    const key = `${folder}/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const fileUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
    const uploadUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}?presigned=true`;

    return { uploadUrl, fileUrl };
  }
}
