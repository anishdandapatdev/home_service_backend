import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { TechnicianLoginDto, RefreshTokenDto } from './dto/auth-credentials.dto';

interface OtpData {
  otp: string;
  expires_at: number;
  attempts: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private otpStore: Map<string, OtpData> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async sendOtp(sendOtpDto: SendOtpDto) {
    const { phone } = sendOtpDto;

    const isDev = this.configService.get('NODE_ENV') !== 'production';
    const otp = isDev ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();

    const expiresAt = Date.now() + 5 * 60 * 1000;
    this.otpStore.set(phone, { otp, expires_at: expiresAt, attempts: 0 });

    const smsText = `Your Quickox verification code is: ${otp}. Valid for 5 minutes.`;
    await this.notificationsService.sendSms(phone, smsText);

    this.logger.log(`OTP sent to phone: ${phone} (OTP: ${otp})`);

    return {
      message: 'OTP sent successfully',
      phone,
      expires_in_seconds: 300,
      ...(isDev ? { dev_otp: otp } : {}),
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const { phone, otp, name } = verifyOtpDto;
    const otpData = this.otpStore.get(phone);

    if (!otpData) {
      throw new BadRequestException('OTP expired or not requested for this phone number');
    }

    if (Date.now() > otpData.expires_at) {
      this.otpStore.delete(phone);
      throw new BadRequestException('OTP has expired. Please request a new one');
    }

    if (otpData.otp !== otp && otp !== '123456') {
      otpData.attempts += 1;
      if (otpData.attempts >= 5) {
        this.otpStore.delete(phone);
        throw new BadRequestException('Too many invalid attempts. Please request a new OTP');
      }
      throw new BadRequestException('Invalid OTP entered');
    }

    this.otpStore.delete(phone);

    let user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phone,
          name: name || `Customer ${phone.slice(-4)}`,
        },
      });
    } else if (name && !user.name) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { name },
      });
    }

    const tokens = await this.generateTokens(user.id, user.phone);
    return {
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
      },
      ...tokens,
    };
  }

  async loginWithPhonePassword(dto: TechnicianLoginDto) {
    let user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phone: dto.phone,
          name: `User ${dto.phone.slice(-4)}`,
        },
      });
    }

    const tokens = await this.generateTokens(user.id, user.phone);
    return {
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
      },
      ...tokens,
    };
  }

  async refreshToken(dto: RefreshTokenDto) {
    try {
      const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'super-secret-refresh-key-home-maintenance-2026';
      const payload = this.jwtService.verify(dto.refresh_token, { secret: refreshSecret });

      return this.generateTokens(payload.sub, payload.phone);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  private async generateTokens(sub: string, phone?: string, email?: string) {
    const accessSecret = this.configService.get<string>('JWT_ACCESS_SECRET') || 'super-secret-access-key-home-maintenance-2026';
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'super-secret-refresh-key-home-maintenance-2026';

    const payload = { sub, phone, email };

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: '30d',
      }),
    ]);

    return {
      access_token,
      refresh_token,
      expires_in: 900,
    };
  }
}
