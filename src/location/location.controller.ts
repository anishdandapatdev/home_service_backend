import { Controller, Post, Patch, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LocationService } from './location.service';
import { UpdateLocationDto } from './dto/update-location.dto';
import { GetUser } from '../common/decorators/get-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Live Location Tracking')
@ApiBearerAuth()
@Controller('technician/jobs')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  /**
   * TECHNICIAN: Tap "Start Journey" — begins tracking session
   * Status changes: ASSIGNED → EN_ROUTE
   * Customer gets SMS + WebSocket notification
   */
  @UseGuards(RolesGuard)
  @Roles(UserRole.TECHNICIAN)
  @Patch(':id/enroute')
  @ApiOperation({
    summary: 'Technician: Start journey to customer — triggers live tracking (like Uber driver starting trip)',
  })
  startJourney(@GetUser('id') techId: string, @Param('id') jobId: string) {
    return this.locationService.startJourney(techId, jobId);
  }

  /**
   * TECHNICIAN: Called every 5 seconds from Flutter to push GPS coordinates.
   * Broadcasts live to customer app via WebSocket.
   */
  @UseGuards(RolesGuard)
  @Roles(UserRole.TECHNICIAN)
  @Post(':id/location')
  @ApiOperation({
    summary: 'Technician: Push live GPS coordinates (call every 5s) — broadcasts to customer via WebSocket',
  })
  updateLocation(
    @GetUser('id') techId: string,
    @Param('id') jobId: string,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.locationService.updateLocation(techId, jobId, dto);
  }

  /**
   * TECHNICIAN: Tap "I have arrived" button.
   * Status changes: EN_ROUTE → ARRIVED
   * Customer gets SMS + WebSocket arrival notification
   */
  @UseGuards(RolesGuard)
  @Roles(UserRole.TECHNICIAN)
  @Patch(':id/arrived')
  @ApiOperation({
    summary: 'Technician: Mark as arrived at customer location — sends arrival alert to customer',
  })
  markArrived(@GetUser('id') techId: string, @Param('id') jobId: string) {
    return this.locationService.markArrived(techId, jobId);
  }
}

@ApiTags('Live Location Tracking')
@ApiBearerAuth()
@Controller('service-requests')
export class TrackingController {
  constructor(private readonly locationService: LocationService) {}

  /**
   * CUSTOMER: Poll or fetch current technician location for a job.
   * Use WebSocket for real-time; use this REST endpoint for initial state.
   */
  @Get(':id/tracking')
  @ApiOperation({
    summary: 'Customer: Get current live location of technician for a job (use WebSocket for real-time updates)',
  })
  getLocation(@Param('id') jobId: string) {
    return this.locationService.getCurrentLocation(jobId);
  }
}
