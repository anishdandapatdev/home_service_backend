import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OnboardTechnicianDto, VerifyKycDto, AssignTechnicianDto } from './dto/admin.dto';
import { MembershipStatus, ServiceRequestStatus, ComplaintStatus, KycStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardMetrics() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [activeMembers, requestsToday, openComplaints, onlineTechnicians] = await Promise.all([
      this.prisma.membership.count({ where: { status: MembershipStatus.ACTIVE } }),
      this.prisma.serviceRequest.count({ where: { created_at: { gte: todayStart } } }),
      this.prisma.complaint.count({ where: { status: { in: [ComplaintStatus.OPEN, ComplaintStatus.IN_PROGRESS] } } }),
      this.prisma.technician.count({ where: { is_active: true, kyc_status: KycStatus.VERIFIED } }),
    ]);

    return {
      active_members: activeMembers,
      requests_today: requestsToday,
      open_complaints: openComplaints,
      online_technicians: onlineTechnicians,
    };
  }

  async getCustomers() {
    return this.prisma.user.findMany({
      include: {
        memberships: { include: { plan: true } },
        addresses: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async getTechnicians() {
    return this.prisma.technician.findMany({
      include: {
        ratings: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async onboardTechnician(dto: OnboardTechnicianDto) {
    const existing = await this.prisma.technician.findUnique({
      where: { phone: dto.phone },
    });

    if (existing) {
      throw new BadRequestException('Technician phone number already registered');
    }

    const passwordHash = dto.password ? await bcrypt.hash(dto.password, 10) : null;

    return this.prisma.technician.create({
      data: {
        phone: dto.phone,
        name: dto.name,
        password_hash: passwordHash,
        skills: dto.skills,
        service_area: dto.service_area,
        kyc_status: KycStatus.PENDING,
      },
    });
  }

  async verifyTechnicianKyc(id: string, dto: VerifyKycDto) {
    const tech = await this.prisma.technician.findUnique({ where: { id } });
    if (!tech) {
      throw new NotFoundException('Technician not found');
    }

    return this.prisma.technician.update({
      where: { id },
      data: { kyc_status: dto.kyc_status },
    });
  }

  async getAllServiceRequests() {
    return this.prisma.serviceRequest.findMany({
      include: {
        user: true,
        technician: true,
        membership: { include: { plan: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async assignTechnicianToJob(requestId: string, dto: AssignTechnicianDto) {
    const tech = await this.prisma.technician.findUnique({
      where: { id: dto.technician_id },
    });

    if (!tech || tech.kyc_status !== KycStatus.VERIFIED) {
      throw new BadRequestException('Technician must be KYC VERIFIED before being eligible for job assignment (Rule #5)');
    }

    return this.prisma.serviceRequest.update({
      where: { id: requestId },
      data: {
        technician_id: tech.id,
        status: ServiceRequestStatus.ASSIGNED,
      },
    });
  }

  async getLeads() {
    return this.prisma.leadCapture.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  // --- Analytical Reports ---

  async getRequestsReport() {
    const requests = await this.prisma.serviceRequest.findMany({
      include: { technician: true },
    });
    return {
      total: requests.length,
      completed: requests.filter((r) => r.status === ServiceRequestStatus.COMPLETED).length,
      in_progress: requests.filter((r) => r.status === ServiceRequestStatus.IN_PROGRESS).length,
      cancelled: requests.filter((r) => r.status === ServiceRequestStatus.CANCELLED).length,
    };
  }

  async getMembersReport() {
    const memberships = await this.prisma.membership.findMany({
      include: { plan: true },
    });
    return {
      total_subscriptions: memberships.length,
      active: memberships.filter((m) => m.status === MembershipStatus.ACTIVE).length,
      expired: memberships.filter((m) => m.status === MembershipStatus.EXPIRED).length,
    };
  }

  async getTechnicianPerformanceReport() {
    const techs = await this.prisma.technician.findMany({
      include: {
        service_requests: true,
        ratings: true,
      },
    });

    return techs.map((t) => ({
      id: t.id,
      name: t.name,
      phone: t.phone,
      completed_jobs: t.service_requests.filter((r) => r.status === ServiceRequestStatus.COMPLETED).length,
      avg_rating:
        t.ratings.length > 0
          ? t.ratings.reduce((acc, r) => acc + r.stars, 0) / t.ratings.length
          : 5.0,
    }));
  }
}
