import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsEnum } from 'class-validator';
import { PaymentReferenceType } from '@prisma/client';

export class CreatePaymentOrderDto {
  @ApiProperty({ example: 499 })
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty({ enum: PaymentReferenceType, example: PaymentReferenceType.MEMBERSHIP })
  @IsNotEmpty()
  @IsEnum(PaymentReferenceType)
  reference_type: PaymentReferenceType;

  @ApiProperty({ example: 'plan-uuid-1234' })
  @IsNotEmpty()
  @IsString()
  reference_id: string;
}

export class VerifyPaymentSignatureDto {
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
