import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { KycStatus, SkillCategory } from '@prisma/client';

export class OnboardTechnicianDto {
  @ApiProperty({ example: '9876543299' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[6-9]\d{9}$/)
  phone: string;

  @ApiProperty({ example: 'Ramesh Sen' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ enum: SkillCategory, isArray: true, example: [SkillCategory.ELECTRICAL, SkillCategory.PLUMBING] })
  @IsNotEmpty()
  @IsArray()
  skills: SkillCategory[];

  @ApiProperty({ example: ['721602', '721607'] })
  @IsNotEmpty()
  @IsArray()
  service_area: string[];

  @ApiPropertyOptional({ example: 'TechPassword123!' })
  @IsOptional()
  @IsString()
  password?: string;
}

export class VerifyKycDto {
  @ApiProperty({ enum: KycStatus, example: KycStatus.VERIFIED })
  @IsNotEmpty()
  @IsEnum(KycStatus)
  kyc_status: KycStatus;
}

export class AssignTechnicianDto {
  @ApiProperty({ example: 'technician-uuid-1234' })
  @IsNotEmpty()
  @IsString()
  technician_id: string;
}
