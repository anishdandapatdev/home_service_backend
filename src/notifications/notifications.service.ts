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

  async sendSms(phone: string, textMessage: string, userId?: string, technicianId?: string): Promise<boolean> {
    const apiKey = this.configService.get<string>('MSG91_API_KEY');
    const senderId = this.configService.get<string>('MSG91_SENDER_ID');

    this.logger.log(`[MSG91 SMS] To: ${phone} | Sender: ${senderId || 'DEFAULT'} | Message: ${textMessage}`);

    if (userId || technicianId) {
      await this.prisma.notification.create({
        data: {
          user_id: userId,
          technician_id: technicianId,
          channel: NotificationChannel.SMS,
          title: 'SMS Notification',
          body: textMessage,
        },
      });
    }

    // In production with real MSG91 API key, execute HTTP fetch to MSG91 API endpoint
    return true;
  }

  async sendPushNotification(
    targetToken: string,
    title: string,
    body: string,
    userId?: string,
    technicianId?: string,
  ): Promise<boolean> {
    this.logger.log(`[FCM/APNs Push] Title: "${title}" | Body: "${body}" | Target: ${targetToken || 'Broadcast'}`);

    if (userId || technicianId) {
      await this.prisma.notification.create({
        data: {
          user_id: userId,
          technician_id: technicianId,
          channel: NotificationChannel.PUSH,
          title,
          body,
        },
      });
    }

    return true;
  }

  async getNotificationHistory(userId?: string, technicianId?: string) {
    return this.prisma.notification.findMany({
      where: {
        ...(userId ? { user_id: userId } : {}),
        ...(technicianId ? { technician_id: technicianId } : {}),
      },
      orderBy: { sent_at: 'desc' },
      take: 50,
    });
  }
}
