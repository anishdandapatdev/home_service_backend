import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PublicService } from './public.service';
import { PlansService } from '../plans/plans.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Public Website Endpoints')
@Public()
@Controller('public')
export class PublicController {
  constructor(
    private readonly publicService: PublicService,
    private readonly plansService: PlansService,
  ) {}

  @Get('services')
  @ApiOperation({ summary: 'Public service catalog list (Electrical, Plumbing, AC, RO, Pump, Geyser, Fan)' })
  getServices() {
    return this.publicService.getServiceCatalog();
  }

  @Get('plans')
  @ApiOperation({ summary: 'Public membership pricing plans (7 tiers ₹399-₹999)' })
  getPlans() {
    return this.plansService.findAllPublic();
  }

  @Get('rewards-info')
  @ApiOperation({ summary: 'Public rewards program details & rules' })
  getRewardsInfo() {
    return this.publicService.getRewardsInfo();
  }

  @Post('leads')
  @ApiOperation({ summary: 'Public lead capture & callback request form submission' })
  captureLead(@Body() dto: CreateLeadDto) {
    return this.publicService.captureLead(dto);
  }

  @Get('service-area')
  @ApiOperation({ summary: 'Public coverage area (Haldia pincodes & expansion roadmap)' })
  getServiceArea() {
    return this.publicService.getServiceAreaInfo();
  }
}
