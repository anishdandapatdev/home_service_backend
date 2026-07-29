import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LogSparePartDto, ApproveSparePartDto } from './dto/spare-part.dto';
import { SparePartApproval } from '@prisma/client';

@Injectable()
export class SparePartsService {
  constructor(private readonly prisma: PrismaService) {}

  async logSparePart(serviceRequestId: string, dto: LogSparePartDto) {
    const serviceRequest = await this.prisma.serviceRequest.findUnique({
      where: { id: serviceRequestId },
    });

    if (!serviceRequest) {
      throw new NotFoundException('Service request not found');
    }

    return this.prisma.sparePart.create({
      data: {
        service_request_id: serviceRequestId,
        name: dto.name,
        cost: dto.cost,
        quantity: dto.quantity,
        approval_status: SparePartApproval.PENDING,
      },
    });
  }

  async getPartsForRequest(serviceRequestId: string) {
    return this.prisma.sparePart.findMany({
      where: { service_request_id: serviceRequestId },
    });
  }

  async approveRejectPart(userId: string, serviceRequestId: string, partId: string, dto: ApproveSparePartDto) {
    const part = await this.prisma.sparePart.findFirst({
      where: {
        id: partId,
        service_request_id: serviceRequestId,
        service_request: { user_id: userId },
      },
    });

    if (!part) {
      throw new NotFoundException('Spare part estimate record not found or access denied');
    }

    return this.prisma.sparePart.update({
      where: { id: partId },
      data: {
        approval_status: dto.approval_status,
        approved_at: dto.approval_status === SparePartApproval.APPROVED ? new Date() : null,
      },
    });
  }
}
