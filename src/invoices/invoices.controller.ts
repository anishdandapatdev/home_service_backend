import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InvoicesService, CreateInvoiceDto } from './invoices.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Invoices')
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Public()
  @Post('generate')
  @ApiOperation({ summary: 'Generate invoice & upload PDF to Cloudinary' })
  generateInvoice(@Body() dto: CreateInvoiceDto) {
    return this.invoicesService.createAndUploadInvoice(dto);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get invoice details & Cloudinary PDF URL by ID' })
  getInvoiceById(@Param('id') id: string) {
    return this.invoicesService.getInvoiceById(id);
  }

  @Public()
  @Get('service-request/:id')
  @ApiOperation({ summary: 'Get invoice detail / download Cloudinary PDF url for service request' })
  getInvoiceByServiceRequestId(@Param('id') serviceRequestId: string) {
    return this.invoicesService.getInvoiceByServiceRequestId(serviceRequestId);
  }
}
