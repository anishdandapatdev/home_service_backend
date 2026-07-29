import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CompleteInspectionDto } from './dto/complete-inspection.dto';
import { InspectionStatus, KycStatus } from '@prisma/client';

@Injectable()
export class InspectionsService {
  private readonly logger = new Logger(InspectionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async autoScheduleInspection(membershipId: string, userPhone: string) {
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + 3); // Auto-set signup + 3 days

    // Auto-assign available verified technician
    const tech = await this.prisma.technician.findFirst({
      where: {
        kyc_status: KycStatus.VERIFIED,
        is_active: true,
      },
    });

    const inspection = await this.prisma.inspection.create({
      data: {
        membership_id: membershipId,
        scheduled_date: scheduledDate,
        status: InspectionStatus.SCHEDULED,
        technician_id: tech ? tech.id : null,
      },
    });

    this.logger.log(`Auto-scheduled inspection ${inspection.id} for membership ${membershipId} on ${scheduledDate.toISOString()}`);

    await this.notificationsService.sendSms(
      userPhone,
      `Welcome to Home Maintenance! Your free preventive home inspection is scheduled for ${scheduledDate.toDateString()}. Technician: ${tech ? tech.name : 'Assigned soon'}.`,
    );

    return inspection;
  }

  async getInspectionForMembership(membershipId: string) {
    const inspection = await this.prisma.inspection.findFirst({
      where: { membership_id: membershipId },
      include: { technician: true },
      orderBy: { created_at: 'desc' },
    });

    if (!inspection) {
      throw new NotFoundException('No inspection found for this membership');
    }
    return inspection;
  }

  async completeInspection(inspectionId: string, techId: string, dto: CompleteInspectionDto) {
    const inspection = await this.prisma.inspection.findUnique({
      where: { id: inspectionId },
    });

    if (!inspection) {
      throw new NotFoundException('Inspection record not found');
    }

    const updated = await this.prisma.inspection.update({
      where: { id: inspectionId },
      data: {
        status: InspectionStatus.COMPLETED,
        report_notes: dto.report_notes,
        photo_urls: dto.photo_urls || [],
        completed_at: new Date(),
        technician_id: techId,
      },
    });

    return updated;
  }
}
