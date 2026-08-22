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

  /**
   * Send OTP Verification SMS to Indian (+91) Numbers
   * Supports 2Factor.in (lowest cost ₹0.165/OTP), Fast2SMS, MSG91, or Dev Simulation
   */
  async sendOtpSms(phone: string, otp: string): Promise<boolean> {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const formattedPhone = phone.startsWith('+') ? phone : `+91${cleanPhone}`;
    const smsText = `Your Quickox verification code is: ${otp}. Valid for 5 minutes.`;

    // 1. Check 2Factor.in Gateway (Lowest cost dedicated Indian OTP provider)
    const twoFactorKey = this.configService.get<string>('TWOFACTOR_API_KEY');
    if (twoFactorKey && !twoFactorKey.includes('dummy') && !twoFactorKey.includes('your_')) {
      try {
        const url = `https://2factor.in/API/V1/${twoFactorKey}/SMS/${cleanPhone}/${otp}/AUTOGEN`;
        const res = await fetch(url);
        const data: any = await res.json();
        this.logger.log(`[2Factor SMS] Dispatched to +91-${cleanPhone}: ${JSON.stringify(data)}`);
        return data.Status === 'Success';
      } catch (err: any) {
        this.logger.error(`[2Factor Error] Failed to send SMS to ${cleanPhone}: ${err.message}`);
      }
    }

    // 2. Check Fast2SMS Gateway (Quick OTP route)
    const fast2smsKey = this.configService.get<string>('FAST2SMS_API_KEY');
    if (fast2smsKey && !fast2smsKey.includes('dummy') && !fast2smsKey.includes('your_')) {
      try {
        const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${fast2smsKey}&variables_values=${otp}&route=otp&numbers=${cleanPhone}`;
        const res = await fetch(url);
        const data: any = await res.json();
        this.logger.log(`[Fast2SMS] Dispatched to +91-${cleanPhone}: ${JSON.stringify(data)}`);
        return data.return === true;
      } catch (err: any) {
        this.logger.error(`[Fast2SMS Error] Failed to send SMS to ${cleanPhone}: ${err.message}`);
      }
    }

    // 3. Check MSG91 Gateway
    const msg91Key = this.configService.get<string>('MSG91_API_KEY');
    const msg91Template = this.configService.get<string>('MSG91_OTP_TEMPLATE_ID');
    if (msg91Key && !msg91Key.includes('dummy') && msg91Template) {
      try {
        const url = `https://control.msg91.com/api/v5/otp?template_id=${msg91Template}&mobile=91${cleanPhone}&authkey=${msg91Key}&otp=${otp}`;
        const res = await fetch(url, { method: 'POST' });
        const data: any = await res.json();
        this.logger.log(`[MSG91 OTP] Dispatched to 91${cleanPhone}: ${JSON.stringify(data)}`);
        return data.type === 'success';
      } catch (err: any) {
        this.logger.error(`[MSG91 Error] Failed to send SMS to ${cleanPhone}: ${err.message}`);
      }
    }

    // 4. Twilio Fallback or Dev Console Simulation
    return this.sendSms(formattedPhone, smsText);
  }

  async sendSms(phone: string, textMessage: string, userId?: string): Promise<boolean> {
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '').slice(-10)}`;
    const twilioFrom = this.configService.get<string>('TWILIO_PHONE_NUMBER');

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
      this.logger.log(`📢 [DEV OTP SIMULATION] SMS to: ${formattedPhone} | Message: "${textMessage}"`);
    }

    if (userId) {
      try {
        await this.prisma.notification.create({
          data: {
            user_id: userId,
            channel: NotificationChannel.SMS,
            title: 'SMS Notification',
            body: textMessage,
          },
        });
      } catch (e) {
        // Optional notification logging
      }
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
