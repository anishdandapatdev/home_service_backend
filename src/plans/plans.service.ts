import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanDto } from './dto/create-plan.dto';

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllPublic() {
    return this.prisma.membershipPlan.findMany({
      where: { is_active: true },
      orderBy: { price: 'asc' },
    });
  }

  async findOne(id: string) {
    const plan = await this.prisma.membershipPlan.findUnique({
      where: { id },
    });
    if (!plan) {
      throw new NotFoundException('Membership plan not found');
    }
    return plan;
  }

  async createPlan(dto: CreatePlanDto) {
    return this.prisma.membershipPlan.create({
      data: dto,
    });
  }

  async updatePlan(id: string, dto: Partial<CreatePlanDto>) {
    await this.findOne(id);
    return this.prisma.membershipPlan.update({
      where: { id },
      data: dto,
    });
  }
}
