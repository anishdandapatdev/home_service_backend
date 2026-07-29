import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InvoicesService } from '../invoices/invoices.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateServiceRequestDto,
  UploadJobPhotosDto,
  CompleteJobDto,
  RateJobDto,
} from './dto/service-request.dto';
import {
  ServiceRequestStatus,
  MembershipStatus,
  KycStatus,
} from '@prisma/client';

@Injectable()
export class ServiceRequestsService {
  private readonly logger = new Logger(ServiceRequestsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly invoicesService: InvoicesService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createServiceRequest(userId: string, dto: CreateServiceRequestDto) {
    const membership = await this.prisma.membership.findFirst({
      where: { user_id: userId, status: MembershipStatus.ACTIVE },
    });

    if (!membership) {
      throw new BadRequestException(
        'Active subscription membership is required to raise a service request',
      );
    }

    // Auto-match eligible technician based on Rule #5 (VERIFIED KYC & skill category match)
    const eligibleTech = await this.prisma.technician.findFirst({
      where: {
        kyc_status: KycStatus.VERIFIED,
        is_active: true,
        skills: { has: dto.category },
      },
    });

    const request = await this.prisma.serviceRequest.create({
      data: {
        user_id: userId,
        membership_id: membership.id,
        category: dto.category,
        description: dto.description,
        requested_time_window: dto.requested_time_window,
        is_emergency: dto.is_emergency || false,
        status: eligibleTech ? ServiceRequestStatus.ASSIGNED : ServiceRequestStatus.RAISED,
        technician_id: eligibleTech ? eligibleTech.id : null,
      },
      include: {
        technician: true,
        membership: { include: { plan: true } },
      },
    });

    if (eligibleTech) {
      await this.notificationsService.sendPushNotification(
        '',
        'New Job Assigned',
        `You have been assigned a new ${dto.category} request.`,
        undefined,
        eligibleTech.id,
      );
    }

    return request;
  }

  async getCustomerRequests(userId: string) {
    return this.prisma.serviceRequest.findMany({
      where: { user_id: userId },
      include: {
        technician: true,
        spare_parts: true,
        invoices: true,
        rating: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async getRequestById(id: string) {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        user: true,
        technician: true,
        spare_parts: true,
        invoices: true,
        rating: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Service request not found');
    }
    return request;
  }

  async cancelRequest(userId: string, id: string) {
    const request = await this.prisma.serviceRequest.findFirst({
      where: { id, user_id: userId },
    });

    if (!request) {
      throw new NotFoundException('Service request not found');
    }

    if (request.status === ServiceRequestStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed service request');
    }

    return this.prisma.serviceRequest.update({
      where: { id },
      data: { status: ServiceRequestStatus.CANCELLED },
    });
  }

  async rateRequest(userId: string, serviceRequestId: string, dto: RateJobDto) {
    const request = await this.prisma.serviceRequest.findFirst({
      where: { id: serviceRequestId, user_id: userId, status: ServiceRequestStatus.COMPLETED },
    });

    if (!request || !request.technician_id) {
      throw new BadRequestException('Rating can only be submitted for completed requests');
    }

    return this.prisma.rating.create({
      data: {
        service_request_id: serviceRequestId,
        technician_id: request.technician_id,
        stars: dto.stars,
        comment: dto.comment,
      },
    });
  }

  // --- Technician Facing Methods ---

  async getTechnicianJobs(techId: string) {
    return this.prisma.serviceRequest.findMany({
      where: { technician_id: techId },
      include: {
        user: { include: { addresses: true } },
        spare_parts: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async startJob(techId: string, jobId: string) {
    const job = await this.prisma.serviceRequest.findFirst({
      where: { id: jobId, technician_id: techId },
    });

    if (!job) {
      throw new NotFoundException('Job not found or not assigned to you');
    }

    return this.prisma.serviceRequest.update({
      where: { id: jobId },
      data: { status: ServiceRequestStatus.IN_PROGRESS },
    });
  }

  async uploadJobPhotos(techId: string, jobId: string, dto: UploadJobPhotosDto) {
    const job = await this.prisma.serviceRequest.findFirst({
      where: { id: jobId, technician_id: techId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return this.prisma.serviceRequest.update({
      where: { id: jobId },
      data: {
        ...(dto.before_photos ? { before_photos: dto.before_photos } : {}),
        ...(dto.after_photos ? { after_photos: dto.after_photos } : {}),
      },
    });
  }

  async completeJob(techId: string, jobId: string, dto: CompleteJobDto) {
    // Rule #9: Job CANNOT move to COMPLETED without customer digital signature!
    if (!dto.customer_signature_url || dto.customer_signature_url.trim() === '') {
      throw new BadRequestException('Digital sign-off rule error: customer signature URL is mandatory to complete a job');
    }

    const job = await this.prisma.serviceRequest.findFirst({
      where: { id: jobId, technician_id: techId },
    });

    if (!job) {
      throw new NotFoundException('Job not found or not assigned');
    }

    const completed = await this.prisma.serviceRequest.update({
      where: { id: jobId },
      data: {
        status: ServiceRequestStatus.COMPLETED,
        customer_signature_url: dto.customer_signature_url,
        completed_at: new Date(),
      },
    });

    // Auto-generate invoice
    await this.invoicesService.generateInvoiceForRequest(jobId);

    return {
      job: completed,
      message: 'Job completed cleanly and digital signature recorded. Invoice generated.',
    };
  }

  async getTechnicianEarnings(techId: string) {
    const completedJobs = await this.prisma.serviceRequest.findMany({
      where: { technician_id: techId, status: ServiceRequestStatus.COMPLETED },
      include: { rating: true },
    });

    const totalJobs = completedJobs.length;
    const avgRating =
      completedJobs.reduce((acc, job) => acc + (job.rating?.stars || 5), 0) / (totalJobs || 1);

    return {
      technician_id: techId,
      completed_jobs_count: totalJobs,
      average_rating: Math.round(avgRating * 10) / 10,
      payout_estimate: totalJobs * 250, // Fixed labor payout calculation per job
    };
  }
}
