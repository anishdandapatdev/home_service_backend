import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RewardsService } from '../rewards/rewards.service';
import { MembershipStatus } from '@prisma/client';

@Injectable()
export class JobsService implements OnModuleInit {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly rewardsService: RewardsService,
  ) {}

  onModuleInit() {
    this.logger.log('Background Jobs Service initialized (Inspection scheduler, Renewal reminders, Rewards cron)');
  }

  // Section 7 Rule 6: Check memberships nearing renewal_date (7/3/1 days out)
  async runRenewalReminderJob() {
    this.logger.log('Executing Renewal Reminder Background Job...');
    const now = new Date();
    const target7Days = new Date();
    target7Days.setDate(now.getDate() + 7);

    const memberships = await this.prisma.membership.findMany({
      where: {
        status: MembershipStatus.ACTIVE,
        renewal_date: { lte: target7Days, gte: now },
      },
      include: { user: true, plan: true },
    });

    let sentCount = 0;
    for (const m of memberships) {
      if (m.user?.phone) {
        await this.notificationsService.sendSms(
          m.user.phone,
          `Reminder: Your ${m.plan.name} home maintenance plan expires on ${m.renewal_date.toDateString()}. Renew today to maintain continuous coverage and earn bonus reward points!`,
          m.user.id,
        );
        sentCount++;
      }
    }

    this.logger.log(`Renewal reminder SMS sent to ${sentCount} members.`);
    return { sent_reminders_count: sentCount };
  }

  // Section 7 Rule 4: Monthly rewards cron job
  async runMonthlyRewardsJob() {
    return this.rewardsService.processNoWasteCycleRewards();
  }
}
