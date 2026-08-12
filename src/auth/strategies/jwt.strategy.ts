import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  phone?: string;
  email?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET') || 'super-secret-access-key-home-maintenance-2026',
    });
  }

  async validate(payload: JwtPayload) {
    const { sub } = payload;

    const user = await this.prisma.user.findUnique({ where: { id: sub } });
    if (!user || !user.is_active) {
      throw new UnauthorizedException('User account is inactive or not found');
    }
    return { id: user.id, phone: user.phone, name: user.name, email: user.email };
  }
}
