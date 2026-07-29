import { Controller, Post, Get, Body, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentOrderDto } from './dto/payment.dto';
import { GetUser } from '../common/decorators/get-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @ApiBearerAuth()
  @Post('razorpay/order')
  @ApiOperation({ summary: 'Create Razorpay order for membership or invoice payment' })
  createOrder(@GetUser('id') userId: string, @Body() dto: CreatePaymentOrderDto) {
    return this.paymentsService.createOrder(userId, dto);
  }

  @Public()
  @Post('razorpay/webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Public webhook listener for Razorpay payment notifications' })
  handleWebhook(
    @Body() payload: any,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    return this.paymentsService.handleWebhook(JSON.stringify(payload), signature);
  }

  @ApiBearerAuth()
  @Get('history')
  @ApiOperation({ summary: 'Customer payment transaction history' })
  getHistory(@GetUser('id') userId: string) {
    return this.paymentsService.getPaymentHistory(userId);
  }
}
