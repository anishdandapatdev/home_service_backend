import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UploadService } from './upload.service';

@ApiTags('Uploads')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('file')
  @ApiOperation({ summary: 'Upload a file (photo, signature, doc) to S3 storage' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        folder: { type: 'string', example: 'inspections' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadSingleFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const fileUrl = await this.uploadService.uploadFile(file, folder || 'general');
    return { url: fileUrl };
  }

  @Post('presigned-url')
  @ApiOperation({ summary: 'Get S3 presigned upload URL for direct mobile/web upload' })
  async getPresignedUrl(
    @Body('filename') filename: string,
    @Body('folder') folder?: string,
  ) {
    if (!filename) {
      throw new BadRequestException('Filename is required');
    }
    return this.uploadService.getPresignedUploadUrl(filename, folder || 'general');
  }
}
