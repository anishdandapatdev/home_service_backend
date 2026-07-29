import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsEnum, Min } from 'class-validator';
import { SparePartApproval } from '@prisma/client';

export class LogSparePartDto {
  @ApiProperty({ example: 'Kirloskar Water Pump 1HP Capacitor' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 450.0 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  cost: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class ApproveSparePartDto {
  @ApiProperty({ enum: SparePartApproval, example: SparePartApproval.APPROVED })
  @IsNotEmpty()
  @IsEnum(SparePartApproval)
  approval_status: SparePartApproval;
}
