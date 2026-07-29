import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Membership Plans')
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Public catalog of all 7 subscription plans with coverage rules' })
  findAllPublic() {
    return this.plansService.findAllPublic();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Public detailed coverage information for a specific plan' })
  findOne(@Param('id') id: string) {
    return this.plansService.findOne(id);
  }
}

@ApiTags('Admin - Plans')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/plans')
export class AdminPlansController {
  constructor(private readonly plansService: PlansService) {}

  @Post()
  @ApiOperation({ summary: 'Admin: Create a new membership plan tier' })
  createPlan(@Body() dto: CreatePlanDto) {
    return this.plansService.createPlan(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Admin: Update pricing or coverage rules for a plan' })
  updatePlan(@Param('id') id: string, @Body() dto: Partial<CreatePlanDto>) {
    return this.plansService.updatePlan(id, dto);
  }
}
