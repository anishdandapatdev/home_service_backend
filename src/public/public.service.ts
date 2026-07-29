import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { SkillCategory, LeadStatus } from '@prisma/client';

@Injectable()
export class PublicService {
  constructor(private readonly prisma: PrismaService) {}

  async getServiceCatalog() {
    return [
      { category: SkillCategory.ELECTRICAL, name: 'Electrical Repairs & Wiring', description: 'Switches, MCB, DB boxes, lighting, short circuit fixes' },
      { category: SkillCategory.PLUMBING, name: 'Plumbing & Pipework', description: 'Taps, leakages, flush tanks, pipe fittings, drain unclogging' },
      { category: SkillCategory.AC, name: 'Air Conditioner Servicing', description: 'Filter cleaning, gas refill check, cooling issues, jet service' },
      { category: SkillCategory.RO, name: 'RO & Water Purifier Care', description: 'Filter replacement, membrane check, TDS adjustment, leakage fix' },
      { category: SkillCategory.PUMP, name: 'Submersible & Water Pump', description: 'Motor inspection, capacitor replace, pressure check, wiring' },
      { category: SkillCategory.GEYSER, name: 'Geyser & Water Heater', description: 'Thermostat, coil replacement, safety valve, winter readiness' },
      { category: SkillCategory.FAN, name: 'Ceiling & Exhaust Fans', description: 'Capacitor, regulator, winding repair, noise & wobble fix' },
      { category: SkillCategory.OTHER, name: 'Custom Home General Maintenance', description: 'General handyman inspection, minor hardware installation' },
    ];
  }

  async getRewardsInfo() {
    return {
      title: 'No-Waste Home Maintenance Rewards Program',
      description: 'Every month you do not raise a service request, earn 100 reward points. Redeem points for genuine spare parts, free RO filter replacements, or e-vouchers.',
      rules: [
        'Earn 100 points for every unused monthly benefit cycle.',
        'Earn 200 bonus points upon timely annual plan renewal.',
        'Points never expire as long as your membership subscription remains active.',
      ],
    };
  }

  async captureLead(dto: CreateLeadDto) {
    return this.prisma.leadCapture.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        message: dto.message,
        source: dto.source || 'WEBSITE',
        status: LeadStatus.NEW,
      },
    });
  }

  async getServiceAreaInfo() {
    return {
      launch_city: 'Haldia',
      covered_pincodes: ['721602', '721607', '721631', '721657'],
      covered_areas: ['Durgachak', 'Sutahata', 'Haldia Town', 'Basudevpur', 'Free Trade Zone'],
      expansion_roadmap: ['Kharagpur', 'Midnapore', 'Howrah'],
    };
  }
}
