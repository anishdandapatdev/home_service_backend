import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRewardCatalogItemDto, RedeemRewardDto } from './dto/rewards.dto';
import { RewardReason, MembershipStatus } from '@prisma/client';

@Injectable()
export class RewardsService {
  private readonly logger = new Logger(RewardsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getMyRewardBalance(userId: string) {
    const ledgers = await this.prisma.rewardLedger.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });

    const totalPoints = ledgers.reduce((sum, item) => sum + item.points, 0);

    return {
      total_points: totalPoints,
      ledger_history: ledgers,
    };
  }

  async getCatalog() {
    return this.prisma.rewardCatalogItem.findMany({
      where: { is_active: true },
      orderBy: { points_required: 'asc' },
    });
  }

  async redeemReward(userId: string, dto: RedeemRewardDto) {
    const catalogItem = await this.prisma.rewardCatalogItem.findUnique({
      where: { id: dto.catalog_item_id },
    });

    if (!catalogItem || !catalogItem.is_active) {
      throw new NotFoundException('Reward item is inactive or not found');
    }

    const { total_points } = await this.getMyRewardBalance(userId);
    if (total_points < catalogItem.points_required) {
      throw new BadRequestException(
        `Insufficient reward points balance (${total_points} points available, ${catalogItem.points_required} required)`,
      );
    }

    const ledger = await this.prisma.rewardLedger.create({
      data: {
        user_id: userId,
        points: -catalogItem.points_required, // Deduct points
        reason: RewardReason.OTHER,
      },
    });

    return {
      message: `Successfully redeemed voucher: ${catalogItem.title}`,
      voucher_code: `VOUCHER-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      points_deducted: catalogItem.points_required,
      remaining_balance: total_points - catalogItem.points_required,
      ledger,
    };
  }

  async createCatalogItem(dto: CreateRewardCatalogItemDto) {
    return this.prisma.rewardCatalogItem.create({
      data: dto,
    });
  }

  // Section 7 Rule 4: Scheduled processor for unused benefit cycles & renewal rewards
  async processNoWasteCycleRewards() {
    this.logger.log('Executing monthly no-waste reward processor for unused benefit cycles...');
    const activeMemberships = await this.prisma.membership.findMany({
      where: { status: MembershipStatus.ACTIVE },
      include: { user: true },
    });

    let creditedCount = 0;
    for (const membership of activeMemberships) {
      // Credit 100 points for unused benefit cycle
      await this.prisma.rewardLedger.create({
        data: {
          user_id: membership.user_id,
          points: 100,
          reason: RewardReason.UNUSED_CYCLE,
        },
      });
      creditedCount++;
    }

    return { message: `Credited unused cycle reward points to ${creditedCount} active members` };
  }
}
