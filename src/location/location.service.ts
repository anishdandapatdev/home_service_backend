import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { LocationGateway } from './location.gateway';
import { UpdateLocationDto } from './dto/update-location.dto';
import { ServiceRequestStatus } from '@prisma/client';

@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly locationGateway: LocationGateway,
  ) {}

  /**
   * Technician taps "Start Journey" button.
   * Status: ASSIGNED → EN_ROUTE
   * Notifies customer via SMS + WebSocket
   */
  async startJourney(techId: string, jobId: string) {
    const job = await this.prisma.serviceRequest.findFirst({
      where: { id: jobId, technician_id: techId },
      include: {
        user: true,
        technician: true,
      },
    });

    if (!job) throw new NotFoundException('Job not found or not assigned to you');

    if (job.status !== ServiceRequestStatus.ASSIGNED) {
      throw new BadRequestException(`Cannot start journey — current job status is: ${job.status}`);
    }

    // Update status to EN_ROUTE
    const updated = await this.prisma.serviceRequest.update({
      where: { id: jobId },
      data: { status: ServiceRequestStatus.EN_ROUTE },
    });

    // Notify customer via SMS
    if (job.user?.phone) {
      await this.notificationsService.sendSms(
        job.user.phone,
        `Your technician ${job.technician?.name || 'is'} is on the way! Track live on your Home Maintenance app.`,
        job.user_id,
      );
    }

    // Broadcast EN_ROUTE event to any connected WebSocket clients
    this.locationGateway.broadcastEnRoute(jobId, job.technician?.name || 'Technician');

    this.logger.log(`Technician ${techId} started journey for job ${jobId}`);
    return { job: updated, message: 'Journey started. Customer has been notified.' };
  }

  /**
   * Technician app calls this every 5 seconds to push GPS coordinates.
   * Updates DB + broadcasts in real-time via WebSocket to customer.
   */
  async updateLocation(techId: string, jobId: string, dto: UpdateLocationDto) {
    const job = await this.prisma.serviceRequest.findFirst({
      where: {
        id: jobId,
        technician_id: techId,
        status: ServiceRequestStatus.EN_ROUTE,
      },
      include: { technician: true },
    });

    if (!job) {
      throw new NotFoundException('No active EN_ROUTE job found. Did you start your journey?');
    }

    // Upsert location record (create if first update, update if already exists)
    const location = await this.prisma.technicianLocation.upsert({
      where: { service_request_id: jobId },
      create: {
        service_request_id: jobId,
        technician_id: techId,
        lat: dto.lat,
        lng: dto.lng,
        heading: dto.heading ?? 0,
        speed_kmh: dto.speed_kmh ?? 0,
      },
      update: {
        lat: dto.lat,
        lng: dto.lng,
        heading: dto.heading ?? 0,
        speed_kmh: dto.speed_kmh ?? 0,
      },
    });

    // Broadcast live to WebSocket room for this job
    this.locationGateway.broadcastLocation(jobId, {
      lat: location.lat,
      lng: location.lng,
      heading: location.heading ?? 0,
      speed_kmh: location.speed_kmh ?? 0,
      status: 'EN_ROUTE',
      technician_name: job.technician?.name || 'Technician',
      updated_at: location.updated_at.toISOString(),
    });

    return location;
  }

  /**
   * Technician taps "I have arrived" button.
   * Status: EN_ROUTE → ARRIVED
   * Customer sees arrival notification.
   */
  async markArrived(techId: string, jobId: string) {
    const job = await this.prisma.serviceRequest.findFirst({
      where: { id: jobId, technician_id: techId },
      include: { user: true, technician: true },
    });

    if (!job) throw new NotFoundException('Job not found');

    if (job.status !== ServiceRequestStatus.EN_ROUTE) {
      throw new BadRequestException(`Cannot mark arrived — current status is: ${job.status}`);
    }

    const updated = await this.prisma.serviceRequest.update({
      where: { id: jobId },
      data: { status: ServiceRequestStatus.ARRIVED },
    });

    // SMS notification to customer
    if (job.user?.phone) {
      await this.notificationsService.sendSms(
        job.user.phone,
        `${job.technician?.name || 'Your technician'} has arrived at your home! Please open the door.`,
        job.user_id,
      );
    }

    // Broadcast arrival via WebSocket
    this.locationGateway.broadcastArrival(jobId, job.technician?.name || 'Technician');

    this.logger.log(`Technician ${techId} arrived at job ${jobId}`);
    return { job: updated, message: 'Marked as arrived. Customer has been notified.' };
  }

  /**
   * Customer / Admin can fetch the current live location of the technician.
   */
  async getCurrentLocation(jobId: string) {
    const location = await this.prisma.technicianLocation.findUnique({
      where: { service_request_id: jobId },
      include: {
        service_request: {
          select: {
            status: true,
            technician: { select: { name: true, phone: true } },
            user: { select: { name: true } },
          },
        },
      },
    });

    if (!location) {
      return { tracking_active: false, message: 'Technician has not started journey yet' };
    }

    return {
      tracking_active: true,
      lat: location.lat,
      lng: location.lng,
      heading: location.heading,
      speed_kmh: location.speed_kmh,
      updated_at: location.updated_at,
      technician_name: location.service_request.technician?.name,
      job_status: location.service_request.status,
    };
  }
}
