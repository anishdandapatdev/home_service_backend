import { Controller, Get, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SparePartsService } from './spare-parts.service';
import { ApproveSparePartDto } from './dto/spare-part.dto';
import { GetUser } from '../common/decorators/get-user.decorator';

@ApiTags('Spare Parts Approval')
@ApiBearerAuth()
@Controller('service-requests')
export class SparePartsController {
  constructor(private readonly sparePartsService: SparePartsService) {}

  @Get(':id/spare-parts')
  @ApiOperation({ summary: 'Customer: View technician-proposed spare parts & cost estimates' })
  getPartsForRequest(@Param('id') serviceRequestId: string) {
    return this.sparePartsService.getPartsForRequest(serviceRequestId);
  }

  @Patch(':id/spare-parts/:partId/approve')
  @ApiOperation({ summary: 'Customer: Approve or reject proposed spare part before billing' })
  approveRejectPart(
    @GetUser('id') userId: string,
    @Param('id') serviceRequestId: string,
    @Param('partId') partId: string,
    @Body() dto: ApproveSparePartDto,
  ) {
    return this.sparePartsService.approveRejectPart(userId, serviceRequestId, partId, dto);
  }
}
