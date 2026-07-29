import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateComplaintDto, UpdateComplaintDto } from './dto/complaint.dto';
import { ComplaintStatus } from '@prisma/client';

@Injectable()
export class ComplaintsService {
  constructor(private readonly prisma: PrismaService) {}

  async createComplaint(userId: string, dto: CreateComplaintDto) {
    return this.prisma.complaint.create({
      data: {
        user_id: userId,
        service_request_id: dto.service_request_id,
        subject: dto.subject,
        description: dto.description,
        status: ComplaintStatus.OPEN,
      },
    });
  }

  async getMyComplaints(userId: string) {
    return this.prisma.complaint.findMany({
      where: { user_id: userId },
      include: { service_request: true },
      orderBy: { created_at: 'desc' },
    });
  }

  async getAdminComplaints(status?: ComplaintStatus) {
    return this.prisma.complaint.findMany({
      where: status ? { status } : {},
      include: {
        user: true,
        service_request: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async updateComplaintStatus(id: string, dto: UpdateComplaintDto) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id },
    });

    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }

    return this.prisma.complaint.update({
      where: { id },
      data: {
        status: dto.status,
        resolution_notes: dto.resolution_notes,
        ...(dto.status === ComplaintStatus.RESOLVED || dto.status === ComplaintStatus.CLOSED
          ? { resolved_at: new Date() }
          : {}),
      },
    });
  }
}
