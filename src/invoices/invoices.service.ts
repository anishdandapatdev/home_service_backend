import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';

export interface CreateInvoiceDto {
  userId?: string;
  title?: string;
  description?: string;
  amount: number;
  tax?: number;
}

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

  async createAndUploadInvoice(dto: CreateInvoiceDto) {
    const amount = Number(dto.amount) || 0;
    const tax = dto.tax ?? Math.round(amount * 0.18 * 100) / 100; // 18% GST default
    const grandTotal = amount + tax;
    const title = dto.title || 'Quickox Service Invoice';
    const description = dto.description || 'Home maintenance labor & service invoice';

    // Generate dummy PDF buffer for Cloudinary upload
    const dummyPdfContent = `%PDF-1.4 Quickox Invoice: ${title} - Grand Total: INR ${grandTotal}`;
    const pdfBuffer = Buffer.from(dummyPdfContent, 'utf-8');

    const filename = `INV-${Date.now()}.pdf`;
    const cloudinaryUrl = await this.uploadService.uploadBuffer(pdfBuffer, filename, 'quickox_invoices');

    const invoice = await this.prisma.invoice.create({
      data: {
        user_id: dto.userId || null,
        title,
        description,
        amount,
        tax,
        grand_total: grandTotal,
        pdf_url: cloudinaryUrl,
      },
    });

    this.logger.log(
      `Generated & Uploaded Invoice ${invoice.id} to Cloudinary: ${cloudinaryUrl} (Grand Total ₹${grandTotal})`,
    );

    return invoice;
  }

  async getInvoiceById(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    return invoice;
  }

  async getInvoiceByServiceRequestId(serviceRequestId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: serviceRequestId },
      include: { user: true },
    });

    if (!invoice) {
      // Fallback: create & return a mock generated Cloudinary invoice
      return this.createAndUploadInvoice({
        amount: 499,
        title: `Service Invoice #${serviceRequestId.slice(0, 8)}`,
      });
    }
    return invoice;
  }
}
