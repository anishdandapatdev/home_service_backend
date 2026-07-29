import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ComplaintsService } from './complaints.service';
import { CreateComplaintDto, UpdateComplaintDto } from './dto/complaint.dto';
import { GetUser } from '../common/decorators/get-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, ComplaintStatus } from '@prisma/client';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Complaints')
@ApiBearerAuth()
@Controller('complaints')
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Post()
  @ApiOperation({ summary: 'Customer: Submit a complaint regarding service quality or technician' })
  create(@GetUser('id') userId: string, @Body() dto: CreateComplaintDto) {
    return this.complaintsService.createComplaint(userId, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Customer: List own submitted complaints' })
  getMyComplaints(@GetUser('id') userId: string) {
    return this.complaintsService.getMyComplaints(userId);
  }
}

@ApiTags('Admin - Complaints')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/complaints')
export class AdminComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Get()
  @ApiOperation({ summary: 'Admin: Get full complaint queue with optional status filter' })
  @ApiQuery({ name: 'status', enum: ComplaintStatus, required: false })
  getComplaints(@Query('status') status?: ComplaintStatus) {
    return this.complaintsService.getAdminComplaints(status);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Admin: Update complaint status and add resolution notes' })
  updateComplaint(
    @Param('id') id: string,
    @Body() dto: UpdateComplaintDto,
  ) {
    return this.complaintsService.updateComplaintStatus(id, dto);
  }
}
