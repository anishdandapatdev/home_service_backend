import { Module } from '@nestjs/common';
import { RewardsController, AdminRewardsController } from './rewards.controller';
import { RewardsService } from './rewards.service';

@Module({
  controllers: [RewardsController, AdminRewardsController],
  providers: [RewardsService],
  exports: [RewardsService],
})
export class RewardsModule {}
