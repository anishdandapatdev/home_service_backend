import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RewardsService } from './rewards.service';
import { CreateRewardCatalogItemDto, RedeemRewardDto } from './dto/rewards.dto';
import { GetUser } from '../common/decorators/get-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Rewards Program')
@Controller('rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Customer: View reward points balance & transaction history' })
  getMyBalance(@GetUser('id') userId: string) {
    return this.rewardsService.getMyRewardBalance(userId);
  }

  @Public()
  @Get('catalog')
  @ApiOperation({ summary: 'Public/Customer: View reward catalog items and partner vouchers' })
  getCatalog() {
    return this.rewardsService.getCatalog();
  }

  @ApiBearerAuth()
  @Post('redeem')
  @ApiOperation({ summary: 'Customer: Redeem points for a reward catalog voucher' })
  redeem(@GetUser('id') userId: string, @Body() dto: RedeemRewardDto) {
    return this.rewardsService.redeemReward(userId, dto);
  }
}

@ApiTags('Admin - Rewards Catalog')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/rewards/catalog')
export class AdminRewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Post()
  @ApiOperation({ summary: 'Admin: Add new partner voucher to reward catalog' })
  createItem(@Body() dto: CreateRewardCatalogItemDto) {
    return this.rewardsService.createCatalogItem(dto);
  }
}
