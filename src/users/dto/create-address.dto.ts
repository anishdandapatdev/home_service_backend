import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateAddressDto {
  @ApiProperty({ example: 'Home', description: 'Label e.g. Home, Office, Villa' })
  @IsNotEmpty()
  @IsString()
  label: string;

  @ApiProperty({ example: 'Flat 402, Green Valley Apartments' })
  @IsNotEmpty()
  @IsString()
  line1: string;

  @ApiPropertyOptional({ example: 'Near City Centre' })
  @IsOptional()
  @IsString()
  line2?: string;

  @ApiProperty({ example: 'Haldia' })
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty({ example: 'West Bengal' })
  @IsNotEmpty()
  @IsString()
  state: string;

  @ApiProperty({ example: '721602' })
  @IsNotEmpty()
  @IsString()
  pincode: string;

  @ApiPropertyOptional({ example: 22.0667 })
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({ example: 88.0667 })
  @IsOptional()
  @IsNumber()
  lng?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}
