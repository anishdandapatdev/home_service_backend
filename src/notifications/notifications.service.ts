import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationChannel } from '@prisma/client';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async sendSms(phone: string, textMessage: string, userId?: string): Promise<boolean> {
    const apiKey = this.configService.get<string>('MSG91_API_KEY');
    const senderId = this.configService.get<string>('MSG91_SENDER_ID');

    this.logger.log(`[MSG91 SMS] To: ${phone} | Sender: ${senderId || 'DEFAULT'} | Message: ${textMessage}`);

    if (userId) {
      await this.prisma.notification.create({
        data: {
          user_id: userId,
          channel: NotificationChannel.SMS,
          title: 'SMS Notification',
          body: textMessage,
        },
      });
    }

    return true;
  }

  async sendPushNotification(
    targetToken: string,
    title: string,
    body: string,
    userId?: string,
  ): Promise<boolean> {
    this.logger.log(`[FCM/APNs Push] Title: "${title}" | Body: "${body}" | Target: ${targetToken || 'Broadcast'}`);

    if (userId) {
      await this.prisma.notification.create({
        data: {
          user_id: userId,
          channel: NotificationChannel.PUSH,
          title,
          body,
        },
      });
    }

    return true;
  }

  async getNotificationsByUserId(userId: string) {
    return this.prisma.notification.findMany({
      where: { user_id: userId },
      orderBy: { sent_at: 'desc' },
    });
  }
}
