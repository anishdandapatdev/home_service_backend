import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';

@ApiTags('Invoices')
@ApiBearerAuth()
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get('service-request/:id')
  @ApiOperation({ summary: 'Get invoice detail / download PDF url for a completed service request' })
  getInvoice(@Param('id') serviceRequestId: string) {
    return this.invoicesService.getInvoiceByServiceRequestId(serviceRequestId);
  }
}
