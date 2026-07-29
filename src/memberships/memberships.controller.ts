import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MembershipsService } from './memberships.service';
import { PurchaseMembershipDto, ConfirmMembershipDto } from './dto/membership.dto';
import { GetUser } from '../common/decorators/get-user.decorator';

@ApiTags('Memberships')
@ApiBearerAuth()
@Controller('memberships')
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Post('purchase')
  @ApiOperation({ summary: 'Initiate membership purchase and get Razorpay order' })
  purchase(@GetUser('id') userId: string, @Body() dto: PurchaseMembershipDto) {
    return this.membershipsService.purchaseMembership(userId, dto);
  }

  @Post('purchase/confirm')
  @ApiOperation({ summary: 'Verify payment signature -> activate membership -> auto-schedule inspection' })
  confirm(@GetUser('id') userId: string, @Body() dto: ConfirmMembershipDto) {
    return this.membershipsService.confirmMembershipPurchase(userId, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current customer membership status, plan coverage & upcoming inspection' })
  getMyMembership(@GetUser('id') userId: string) {
    return this.membershipsService.getMyMembership(userId);
  }

  @Post(':id/renew')
  @ApiOperation({ summary: 'Initiate membership renewal payment flow' })
  renew(@GetUser('id') userId: string, @Param('id') membershipId: string) {
    return this.membershipsService.renewMembership(userId, membershipId);
  }
}
