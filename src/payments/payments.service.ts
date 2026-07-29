import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentOrderDto, VerifyPaymentSignatureDto } from './dto/payment.dto';
import { PaymentStatus } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async createOrder(userId: string, dto: CreatePaymentOrderDto) {
    const keyId = this.configService.get<string>('RAZORPAY_KEY_ID') || 'rzp_test_dummy_key_id';
    const razorpayOrderId = `order_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    const payment = await this.prisma.payment.create({
      data: {
        user_id: userId,
        amount: dto.amount,
        reference_type: dto.reference_type,
        reference_id: dto.reference_id,
        razorpay_order_id: razorpayOrderId,
        status: PaymentStatus.CREATED,
      },
    });

    this.logger.log(`Created Razorpay Order ${razorpayOrderId} for amount ₹${dto.amount}`);

    return {
      payment_id: payment.id,
      razorpay_order_id: razorpayOrderId,
      amount: dto.amount * 100, // Amount in paise
      currency: 'INR',
      key_id: keyId,
    };
  }

  async verifySignature(dto: VerifyPaymentSignatureDto): Promise<boolean> {
    const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET') || 'rzp_test_dummy_key_secret';

    const body = `${dto.razorpay_order_id}|${dto.razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body)
      .digest('hex');

    // In dev sandbox mode with dummy keys, accept if signatures match or dev mode override
    const isDev = this.configService.get('NODE_ENV') !== 'production';
    const isValid = expectedSignature === dto.razorpay_signature || (isDev && dto.razorpay_signature.startsWith('dummy_'));

    if (!isValid) {
      this.logger.warn(`Razorpay payment signature mismatch for order ${dto.razorpay_order_id}`);
    }

    return isValid;
  }

  async recordPaymentSuccess(razorpayOrderId: string, paymentId: string, signature: string) {
    return this.prisma.payment.update({
      where: { razorpay_order_id: razorpayOrderId },
      data: {
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
        status: PaymentStatus.SUCCESS,
      },
    });
  }

  async handleWebhook(rawBody: string, signature: string) {
    const webhookSecret = this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET') || 'rzp_webhook_secret_dummy';

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const isDev = this.configService.get('NODE_ENV') !== 'production';
    if (expectedSignature !== signature && !isDev) {
      throw new BadRequestException('Invalid webhook signature');
    }

    this.logger.log('Razorpay webhook event received successfully');
    return { status: 'processed' };
  }

  async getPaymentHistory(userId: string) {
    return this.prisma.payment.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });
  }
}
