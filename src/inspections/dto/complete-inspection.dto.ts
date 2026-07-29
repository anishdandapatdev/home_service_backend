import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CompleteInspectionDto {
  @ApiProperty({ example: 'All electrical DB points & geyser grounding checked cleanly' })
  @IsNotEmpty()
  @IsString()
  report_notes: string;

  @ApiProperty({ example: ['https://s3.amazonaws.com/inspection-photo-1.jpg'] })
  @IsOptional()
  @IsArray()
  photo_urls?: string[];
}
