import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationChannel } from '@prisma/client';
import * as TwilioSDK from 'twilio';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private twilioClient: any = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    if (accountSid && authToken && accountSid.startsWith('AC')) {
      try {
        const createClient = (TwilioSDK as any).default || TwilioSDK;
        this.twilioClient =
          typeof createClient === 'function'
            ? createClient(accountSid, authToken)
            : require('twilio')(accountSid, authToken);
        this.logger.log('✅ Twilio SMS client initialized successfully.');
      } catch (err: any) {
        this.logger.error(`Failed to initialize Twilio client: ${err.message}`);
      }
    }
  }

  async sendVerifyOtp(phone: string): Promise<boolean> {
    const serviceSid = this.configService.get<string>('TWILIO_VERIFY_SERVICE_SID');
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`;

    if (this.twilioClient && serviceSid) {
      try {
        const verification = await this.twilioClient.verify.v2
          .services(serviceSid)
          .verifications.create({ to: formattedPhone, channel: 'sms' });
        this.logger.log(`[Twilio Verify] OTP dispatched to ${formattedPhone}, status: ${verification.status}`);
        return true;
      } catch (err: any) {
        this.logger.error(`[Twilio Verify Error] Failed to dispatch OTP to ${formattedPhone}: ${err.message}`);
      }
    }
    return false;
  }

  async checkVerifyOtp(phone: string, code: string): Promise<boolean> {
    const serviceSid = this.configService.get<string>('TWILIO_VERIFY_SERVICE_SID');
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`;

    if (this.twilioClient && serviceSid) {
      try {
        const check = await this.twilioClient.verify.v2
          .services(serviceSid)
          .verificationChecks.create({ to: formattedPhone, code });
        this.logger.log(`[Twilio Verify Check] ${formattedPhone} status: ${check.status}`);
        return check.status === 'approved';
      } catch (err: any) {
        this.logger.error(`[Twilio Verify Check Error] ${err.message}`);
        return false;
      }
    }
    return false;
  }

  async sendSms(phone: string, textMessage: string, userId?: string): Promise<boolean> {
    const twilioFrom = this.configService.get<string>('TWILIO_PHONE_NUMBER');
    // Ensure international E.164 format
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`;

    if (this.twilioClient && twilioFrom) {
      try {
        const response = await this.twilioClient.messages.create({
          body: textMessage,
          from: twilioFrom,
          to: formattedPhone,
        });
        this.logger.log(`[Twilio SMS] Successfully sent to ${formattedPhone} (SID: ${response.sid})`);
      } catch (err: any) {
        this.logger.error(`[Twilio SMS Error] Failed to send SMS to ${formattedPhone}: ${err.message}`);
      }
    } else {
      this.logger.warn(`[SMS Simulation] To: ${formattedPhone} | Message: ${textMessage}`);
    }

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
