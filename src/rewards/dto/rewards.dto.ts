import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateRewardCatalogItemDto {
  @ApiProperty({ example: '₹200 Off Next Spare Part Invoice' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'Redeem 500 points for ₹200 discount on billable spare parts.' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ example: 500 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  points_required: number;

  @ApiProperty({ example: 'Home Maintenance Platform' })
  @IsNotEmpty()
  @IsString()
  partner_name: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class RedeemRewardDto {
  @ApiProperty({ example: 'catalog-item-uuid' })
  @IsNotEmpty()
  @IsString()
  catalog_item_id: string;
}
