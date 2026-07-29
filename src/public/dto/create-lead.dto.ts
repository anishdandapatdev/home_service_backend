import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateLeadDto {
  @ApiProperty({ example: 'Siddharth Roy' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: '9876543210' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[6-9]\d{9}$/)
  phone: string;

  @ApiPropertyOptional({ example: 'siddharth@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'Interested in Tier 4 RO subscription plan for 2 BHK apartment in Haldia.' })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({ example: 'WEBSITE_HERO_FORM' })
  @IsOptional()
  @IsString()
  source?: string;
}
