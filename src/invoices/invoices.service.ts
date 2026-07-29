import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SparePartApproval } from '@prisma/client';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generateInvoiceForRequest(serviceRequestId: string) {
    const serviceRequest = await this.prisma.serviceRequest.findUnique({
      where: { id: serviceRequestId },
      include: {
        membership: true,
        spare_parts: true,
      },
    });

    if (!serviceRequest) {
      throw new NotFoundException('Service request not found');
    }

    // Labour cost is 0 because active membership plan covers labour
    const labourCost = 0;

    // Filter ONLY customer-approved spare parts (Rule 3)
    const approvedParts = serviceRequest.spare_parts.filter(
      (p) => p.approval_status === SparePartApproval.APPROVED,
    );

    const partsTotal = approvedParts.reduce((sum, p) => sum + p.cost * p.quantity, 0);
    const tax = Math.round(partsTotal * 0.18 * 100) / 100; // 18% GST
    const grandTotal = partsTotal + tax;

    const pdfUrl = `https://home-maintenance-assets.s3.ap-south-1.amazonaws.com/invoices/INV-${Date.now()}.pdf`;

    const invoice = await this.prisma.invoice.create({
      data: {
        service_request_id: serviceRequestId,
        labour_cost: labourCost,
        parts_total: partsTotal,
        tax: tax,
        grand_total: grandTotal,
        pdf_url: pdfUrl,
      },
    });

    this.logger.log(
      `Generated Invoice ${invoice.id} for request ${serviceRequestId}: Labour ₹${labourCost}, Parts ₹${partsTotal}, Tax ₹${tax}, Grand Total ₹${grandTotal}`,
    );

    return invoice;
  }

  async getInvoiceByServiceRequestId(serviceRequestId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { service_request_id: serviceRequestId },
      include: {
        service_request: {
          include: {
            user: true,
            spare_parts: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found for this service request');
    }
    return invoice;
  }
}
