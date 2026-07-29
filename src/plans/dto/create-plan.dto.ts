import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class CreatePlanDto {
  @ApiProperty({ example: 'TIER_1' })
  @IsNotEmpty()
  @IsString()
  tier_code: string;

  @ApiProperty({ example: 'Essential Electrical & Fan Plan' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 399 })
  @IsNotEmpty()
  @IsNumber()
  price: number;

  @ApiProperty({
    example: {
      categories: ['ELECTRICAL', 'FAN'],
      annual_visits: 6,
      emergency_priority: false,
      labour_covered: true,
    },
  })
  @IsNotEmpty()
  @IsObject()
  coverage_rules: any;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
