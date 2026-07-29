import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { OnboardTechnicianDto, VerifyKycDto, AssignTechnicianDto } from './dto/admin.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Admin Panel')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Admin: Real-time dashboard KPI metrics (active members, requests today, open complaints)' })
  getDashboard() {
    return this.adminService.getDashboardMetrics();
  }

  @Get('customers')
  @ApiOperation({ summary: 'Admin: List and search customer accounts and active subscriptions' })
  getCustomers() {
    return this.adminService.getCustomers();
  }

  @Get('technicians')
  @ApiOperation({ summary: 'Admin: List technicians and KYC verification status' })
  getTechnicians() {
    return this.adminService.getTechnicians();
  }

  @Post('technicians')
  @ApiOperation({ summary: 'Admin: Onboard a new field technician' })
  onboardTechnician(@Body() dto: OnboardTechnicianDto) {
    return this.adminService.onboardTechnician(dto);
  }

  @Patch('technicians/:id/verify')
  @ApiOperation({ summary: 'Admin: Approve technician KYC status -> eligible for job assignment (Rule #5)' })
  verifyKyc(@Param('id') id: string, @Body() dto: VerifyKycDto) {
    return this.adminService.verifyTechnicianKyc(id, dto);
  }

  @Get('service-requests')
  @ApiOperation({ summary: 'Admin: View full service request queue' })
  getServiceRequests() {
    return this.adminService.getAllServiceRequests();
  }

  @Patch('service-requests/:id/assign')
  @ApiOperation({ summary: 'Admin: Assign or reassign technician to a service request' })
  assignTechnician(@Param('id') requestId: string, @Body() dto: AssignTechnicianDto) {
    return this.adminService.assignTechnicianToJob(requestId, dto);
  }

  @Get('leads')
  @ApiOperation({ summary: 'Admin: View lead capture entries submitted from public website' })
  getLeads() {
    return this.adminService.getLeads();
  }

  // --- Reports Endpoints ---

  @Get('reports/requests')
  @ApiOperation({ summary: 'Admin: Service request volume and completion report' })
  getRequestsReport() {
    return this.adminService.getRequestsReport();
  }

  @Get('reports/members')
  @ApiOperation({ summary: 'Admin: Active membership subscription growth report' })
  getMembersReport() {
    return this.adminService.getMembersReport();
  }

  @Get('reports/technician-performance')
  @ApiOperation({ summary: 'Admin: Field technician performance & rating report' })
  getTechnicianPerformanceReport() {
    return this.adminService.getTechnicianPerformanceReport();
  }
}
