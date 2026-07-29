import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ComplaintStatus } from '@prisma/client';

export class CreateComplaintDto {
  @ApiPropertyOptional({ example: 'service-request-uuid-1234' })
  @IsOptional()
  @IsString()
  service_request_id?: string;

  @ApiProperty({ example: 'Technician arrived 30 mins late' })
  @IsNotEmpty()
  @IsString()
  subject: string;

  @ApiProperty({ example: 'Technician reached at 11:30 AM instead of agreed 11:00 AM slot.' })
  @IsNotEmpty()
  @IsString()
  description: string;
}

export class UpdateComplaintDto {
  @ApiProperty({ enum: ComplaintStatus, example: ComplaintStatus.RESOLVED })
  @IsNotEmpty()
  @IsEnum(ComplaintStatus)
  status: ComplaintStatus;

  @ApiPropertyOptional({ example: 'Contacted customer and credited 200 reward points as bonus compensation.' })
  @IsOptional()
  @IsString()
  resolution_notes?: string;
}
