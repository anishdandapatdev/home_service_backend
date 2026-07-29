import { Module } from '@nestjs/common';
import { ServiceRequestsController, TechnicianJobsController } from './service-requests.controller';
import { ServiceRequestsService } from './service-requests.service';
import { InvoicesModule } from '../invoices/invoices.module';
import { SparePartsModule } from '../spare-parts/spare-parts.module';

@Module({
  imports: [InvoicesModule, SparePartsModule],
  controllers: [ServiceRequestsController, TechnicianJobsController],
  providers: [ServiceRequestsService],
  exports: [ServiceRequestsService],
})
export class ServiceRequestsModule {}
