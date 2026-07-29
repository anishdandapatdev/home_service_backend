import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsArray, Min, Max } from 'class-validator';
import { SkillCategory } from '@prisma/client';

export class CreateServiceRequestDto {
  @ApiProperty({ enum: SkillCategory, example: SkillCategory.ELECTRICAL })
  @IsNotEmpty()
  @IsEnum(SkillCategory)
  category: SkillCategory;

  @ApiProperty({ example: 'Ceiling fan making squeaking noise and humming in bedroom 1' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiPropertyOptional({ example: 'Tomorrow 10:00 AM - 1:00 PM' })
  @IsOptional()
  @IsString()
  requested_time_window?: string;

  @ApiPropertyOptional({ example: false, description: 'Flag for urgent emergency dispatch' })
  @IsOptional()
  @IsBoolean()
  is_emergency?: boolean;
}

export class UploadJobPhotosDto {
  @ApiPropertyOptional({ example: ['https://s3.amazonaws.com/before-1.jpg'] })
  @IsOptional()
  @IsArray()
  before_photos?: string[];

  @ApiPropertyOptional({ example: ['https://s3.amazonaws.com/after-1.jpg'] })
  @IsOptional()
  @IsArray()
  after_photos?: string[];
}

export class CompleteJobDto {
  @ApiProperty({
    example: 'https://s3.amazonaws.com/signatures/sig-1234.png',
    description: 'Digital signature URL collected from customer upon completion (Rule #9)',
  })
  @IsNotEmpty()
  @IsString()
  customer_signature_url: string;
}

export class RateJobDto {
  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsNotEmpty()
  @Min(1)
  @Max(5)
  stars: number;

  @ApiPropertyOptional({ example: 'Excellent quick service! Punctual technician.' })
  @IsOptional()
  @IsString()
  comment?: string;
}
