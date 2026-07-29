import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ServiceRequestsService } from './service-requests.service';
import { SparePartsService } from '../spare-parts/spare-parts.service';
import {
  CreateServiceRequestDto,
  UploadJobPhotosDto,
  CompleteJobDto,
  RateJobDto,
} from './dto/service-request.dto';
import { LogSparePartDto } from '../spare-parts/dto/spare-part.dto';
import { GetUser } from '../common/decorators/get-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Service Requests')
@ApiBearerAuth()
@Controller('service-requests')
export class ServiceRequestsController {
  constructor(private readonly serviceRequestsService: ServiceRequestsService) {}

  @Post()
  @ApiOperation({ summary: 'Customer: Raise a new service request (Electrical, Plumbing, AC, RO, Fan, etc.)' })
  create(@GetUser('id') userId: string, @Body() dto: CreateServiceRequestDto) {
    return this.serviceRequestsService.createServiceRequest(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Customer: List all own service requests' })
  findAllCustomer(@GetUser('id') userId: string) {
    return this.serviceRequestsService.getCustomerRequests(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Customer / Tech: Get detailed status of a specific request' })
  findOne(@Param('id') id: string) {
    return this.serviceRequestsService.getRequestById(id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Customer: Cancel a service request' })
  cancel(@GetUser('id') userId: string, @Param('id') id: string) {
    return this.serviceRequestsService.cancelRequest(userId, id);
  }

  @Post(':id/rate')
  @ApiOperation({ summary: 'Customer: Post-job rating and review (1 to 5 stars)' })
  rate(
    @GetUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: RateJobDto,
  ) {
    return this.serviceRequestsService.rateRequest(userId, id, dto);
  }
}

@ApiTags('Technician Jobs')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.TECHNICIAN)
@Controller('technician')
export class TechnicianJobsController {
  constructor(
    private readonly serviceRequestsService: ServiceRequestsService,
    private readonly sparePartsService: SparePartsService,
  ) {}

  @Get('jobs')
  @ApiOperation({ summary: 'Technician: Get list of assigned jobs' })
  getJobs(@GetUser('id') techId: string) {
    return this.serviceRequestsService.getTechnicianJobs(techId);
  }

  @Patch('jobs/:id/start')
  @ApiOperation({ summary: 'Technician: Mark job status as IN_PROGRESS' })
  startJob(@GetUser('id') techId: string, @Param('id') jobId: string) {
    return this.serviceRequestsService.startJob(techId, jobId);
  }

  @Post('jobs/:id/photos')
  @ApiOperation({ summary: 'Technician: Upload before & after photos for job' })
  uploadPhotos(
    @GetUser('id') techId: string,
    @Param('id') jobId: string,
    @Body() dto: UploadJobPhotosDto,
  ) {
    return this.serviceRequestsService.uploadJobPhotos(techId, jobId, dto);
  }

  @Post('jobs/:id/spare-parts')
  @ApiOperation({ summary: 'Technician: Log required spare parts for customer approval' })
  logSparePart(
    @Param('id') jobId: string,
    @Body() dto: LogSparePartDto,
  ) {
    return this.sparePartsService.logSparePart(jobId, dto);
  }

  @Post('jobs/:id/complete')
  @ApiOperation({ summary: 'Technician: Complete job with customer digital signature (Rule #9)' })
  completeJob(
    @GetUser('id') techId: string,
    @Param('id') jobId: string,
    @Body() dto: CompleteJobDto,
  ) {
    return this.serviceRequestsService.completeJob(techId, jobId, dto);
  }

  @Get('earnings')
  @ApiOperation({ summary: 'Technician: View earnings & performance summary' })
  getEarnings(@GetUser('id') techId: string) {
    return this.serviceRequestsService.getTechnicianEarnings(techId);
  }
}
