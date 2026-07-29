import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InspectionsService } from './inspections.service';
import { CompleteInspectionDto } from './dto/complete-inspection.dto';
import { GetUser } from '../common/decorators/get-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Inspections')
@ApiBearerAuth()
@Controller('inspections')
export class InspectionsController {
  constructor(private readonly inspectionsService: InspectionsService) {}

  @Get('membership/:membershipId')
  @ApiOperation({ summary: 'Get preventive inspection report for active membership' })
  getInspectionForMembership(@Param('membershipId') membershipId: string) {
    return this.inspectionsService.getInspectionForMembership(membershipId);
  }

  @Post(':id/complete')
  @UseGuards(RolesGuard)
  @Roles(UserRole.TECHNICIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Technician: Complete preventive inspection with report & photos' })
  completeInspection(
    @Param('id') inspectionId: string,
    @GetUser('id') techId: string,
    @Body() dto: CompleteInspectionDto,
  ) {
    return this.inspectionsService.completeInspection(inspectionId, techId, dto);
  }
}
