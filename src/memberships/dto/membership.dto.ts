import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class PurchaseMembershipDto {
  @ApiProperty({ example: 'plan-uuid-or-tier-code' })
  @IsNotEmpty()
  @IsString()
  plan_id: string;
}

export class ConfirmMembershipDto {
  @ApiProperty({ example: 'payment-id-uuid' })
  @IsNotEmpty()
  @IsString()
  payment_id: string;

  @ApiProperty({ example: 'order_9A33XWu2A5A' })
  @IsNotEmpty()
  @IsString()
  razorpay_order_id: string;

  @ApiProperty({ example: 'pay_293847293847' })
  @IsNotEmpty()
  @IsString()
  razorpay_payment_id: string;

  @ApiProperty({ example: 'f6b21b7ff3...' })
  @IsNotEmpty()
  @IsString()
  razorpay_signature: string;
}
