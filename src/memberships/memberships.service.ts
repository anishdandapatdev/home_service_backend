import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { InspectionsService } from '../inspections/inspections.service';
import { PurchaseMembershipDto, ConfirmMembershipDto } from './dto/membership.dto';
import { PaymentReferenceType, MembershipStatus } from '@prisma/client';

@Injectable()
export class MembershipsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
    private readonly inspectionsService: InspectionsService,
  ) {}

  async purchaseMembership(userId: string, dto: PurchaseMembershipDto) {
    const plan = await this.prisma.membershipPlan.findFirst({
      where: {
        OR: [{ id: dto.plan_id }, { tier_code: dto.plan_id }],
        is_active: true,
      },
    });

    if (!plan) {
      throw new NotFoundException('Selected membership plan is inactive or not found');
    }

    const order = await this.paymentsService.createOrder(userId, {
      amount: plan.price,
      reference_type: PaymentReferenceType.MEMBERSHIP,
      reference_id: plan.id,
    });

    return {
      order,
      plan: {
        id: plan.id,
        name: plan.name,
        price: plan.price,
        tier_code: plan.tier_code,
      },
    };
  }

  async confirmMembershipPurchase(userId: string, dto: ConfirmMembershipDto) {
    const isValid = await this.paymentsService.verifySignature({
      razorpay_order_id: dto.razorpay_order_id,
      razorpay_payment_id: dto.razorpay_payment_id,
      razorpay_signature: dto.razorpay_signature,
    });

    if (!isValid) {
      throw new BadRequestException('Payment verification failed: invalid signature');
    }

    const payment = await this.paymentsService.recordPaymentSuccess(
      dto.razorpay_order_id,
      dto.razorpay_payment_id,
      dto.razorpay_signature,
    );

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const planId = payment.reference_id;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1); // 1-year coverage

    const membership = await this.prisma.membership.create({
      data: {
        user_id: userId,
        plan_id: planId,
        status: MembershipStatus.ACTIVE,
        start_date: startDate,
        end_date: endDate,
        renewal_date: endDate,
      },
      include: { plan: true },
    });

    // Auto-schedule inspection within 3 days (Section 7 Rule 1)
    await this.inspectionsService.autoScheduleInspection(membership.id, user.phone);

    return {
      membership,
      message: 'Membership activated successfully! Preventive inspection auto-scheduled within 3 days.',
    };
  }

  async getMyMembership(userId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { user_id: userId, status: MembershipStatus.ACTIVE },
      include: {
        plan: true,
        inspections: { orderBy: { scheduled_date: 'desc' }, take: 1 },
      },
      orderBy: { created_at: 'desc' },
    });

    if (!membership) {
      return { active: false, message: 'No active membership subscription found' };
    }

    return {
      active: true,
      membership,
    };
  }

  async renewMembership(userId: string, membershipId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { id: membershipId, user_id: userId },
      include: { plan: true },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    return this.paymentsService.createOrder(userId, {
      amount: membership.plan.price,
      reference_type: PaymentReferenceType.MEMBERSHIP,
      reference_id: membership.plan.id,
    });
  }
}
