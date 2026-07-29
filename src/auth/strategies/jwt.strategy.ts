import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  role: UserRole;
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
    const { sub, role } = payload;

    if (role === UserRole.CUSTOMER) {
      const user = await this.prisma.user.findUnique({ where: { id: sub } });
      if (!user || !user.is_active) {
        throw new UnauthorizedException('User account is inactive or not found');
      }
      return { id: user.id, phone: user.phone, role: user.role, name: user.name, email: user.email };
    }

    if (role === UserRole.TECHNICIAN) {
      const tech = await this.prisma.technician.findUnique({ where: { id: sub } });
      if (!tech || !tech.is_active) {
        throw new UnauthorizedException('Technician account is inactive or not found');
      }
      return { id: tech.id, phone: tech.phone, role: UserRole.TECHNICIAN, name: tech.name, kyc_status: tech.kyc_status };
    }

    if (role === UserRole.ADMIN) {
      const admin = await this.prisma.adminUser.findUnique({ where: { id: sub } });
      if (!admin) {
        throw new UnauthorizedException('Admin account not found');
      }
      return { id: admin.id, email: admin.email, role: UserRole.ADMIN, name: admin.name };
    }

    throw new UnauthorizedException('Invalid token payload');
  }
}
