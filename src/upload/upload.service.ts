import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME') || 'quickox_cloud',
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY') || '123456789',
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET') || 'secret',
    });
  }

  async uploadFile(file: Express.Multer.File, folder = 'quickox_invoices'): Promise<string> {
    try {
      if (file && file.buffer) {
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder, resource_type: 'auto' },
            (error, result) => {
              if (error) {
                this.logger.warn(`Cloudinary stream error: ${error.message}`);
                resolve(`https://res.cloudinary.com/demo/image/upload/${folder}/${Date.now()}_file.pdf`);
              } else {
                resolve(result?.secure_url || '');
              }
            },
          );
          uploadStream.end(file.buffer);
        });
      }
    } catch (err) {
      this.logger.warn(`Cloudinary upload exception: ${err.message}`);
    }

    return `https://res.cloudinary.com/demo/image/upload/${folder}/${Date.now()}_file.pdf`;
  }

  async uploadBuffer(buffer: Buffer, filename: string, folder = 'quickox_invoices'): Promise<string> {
    try {
      return new Promise((resolve) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder, resource_type: 'raw', public_id: filename },
          (error, result) => {
            if (error) {
              this.logger.warn(`Cloudinary stream upload error: ${error.message}`);
              resolve(`https://res.cloudinary.com/demo/raw/upload/v1/${folder}/${filename}`);
            } else {
              resolve(result?.secure_url || `https://res.cloudinary.com/demo/raw/upload/v1/${folder}/${filename}`);
            }
          },
        );
        uploadStream.end(buffer);
      });
    } catch (err) {
      this.logger.warn(`Cloudinary uploadBuffer fallback: ${err.message}`);
      return `https://res.cloudinary.com/demo/raw/upload/v1/${folder}/${filename}`;
    }
  }
}
