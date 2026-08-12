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
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Uploads')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Public()
  @Post('file')
  @ApiOperation({ summary: 'Upload a file (PDF, photo, document) to Cloudinary storage' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        folder: { type: 'string', example: 'invoices' },
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
    const fileUrl = await this.uploadService.uploadFile(file, folder || 'quickox_uploads');
    return { url: fileUrl };
  }

  @Public()
  @Post('presigned-url')
  @ApiOperation({ summary: 'Get Cloudinary direct upload endpoint' })
  async getPresignedUrl(
    @Body('filename') filename: string,
    @Body('folder') folder?: string,
  ) {
    if (!filename) {
      throw new BadRequestException('Filename is required');
    }
    const key = `${folder || 'quickox_uploads'}/${Date.now()}_${filename}`;
    return {
      uploadUrl: `https://api.cloudinary.com/v1_1/demo/auto/upload`,
      fileUrl: `https://res.cloudinary.com/demo/image/upload/v1/${key}`,
    };
  }
}
