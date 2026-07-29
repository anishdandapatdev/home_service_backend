import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { RewardsModule } from '../rewards/rewards.module';

@Module({
  imports: [RewardsModule],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
