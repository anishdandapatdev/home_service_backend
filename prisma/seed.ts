import { PrismaClient, UserRole, KycStatus, SkillCategory } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Home Maintenance Platform database...');

  // 1. Seed Admin User
  const adminPasswordHash = await bcrypt.hash('AdminPassword123!', 10);
  const admin = await prisma.adminUser.upsert({
    where: { email: 'admin@homemaintenance.com' },
    update: {},
    create: {
      email: 'admin@homemaintenance.com',
      name: 'Super Admin',
      password_hash: adminPasswordHash,
      role: UserRole.ADMIN,
    },
  });
  console.log(`Admin user created: ${admin.email}`);

  // 2. Seed 7 Membership Plans
  const plans = [
    {
      tier_code: 'TIER_1',
      name: 'Essential Electrical & Fan Plan',
      price: 399,
      coverage_rules: {
        categories: ['ELECTRICAL', 'FAN'],
        annual_visits: 6,
        emergency_priority: false,
        labour_covered: true,
        inspection_included: true,
      },
    },
    {
      tier_code: 'TIER_2',
      name: 'Electrical & Plumbing Care',
      price: 499,
      coverage_rules: {
        categories: ['ELECTRICAL', 'PLUMBING', 'FAN'],
        annual_visits: 8,
        emergency_priority: false,
        labour_covered: true,
        inspection_included: true,
      },
    },
    {
      tier_code: 'TIER_3',
      name: 'Home Essentials Plus (Pump & Geyser)',
      price: 599,
      coverage_rules: {
        categories: ['ELECTRICAL', 'PLUMBING', 'FAN', 'PUMP', 'GEYSER'],
        annual_visits: 10,
        emergency_priority: false,
        labour_covered: true,
        inspection_included: true,
      },
    },
    {
      tier_code: 'TIER_4',
      name: 'Complete Home & RO Pure Care',
      price: 699,
      coverage_rules: {
        categories: ['ELECTRICAL', 'PLUMBING', 'FAN', 'PUMP', 'GEYSER', 'RO'],
        annual_visits: 12,
        emergency_priority: false,
        labour_covered: true,
        inspection_included: true,
      },
    },
    {
      tier_code: 'TIER_5',
      name: 'Comfort & Climate Shield (AC Filter)',
      price: 799,
      coverage_rules: {
        categories: ['ELECTRICAL', 'PLUMBING', 'FAN', 'PUMP', 'GEYSER', 'RO', 'AC'],
        annual_visits: 14,
        emergency_priority: false,
        labour_covered: true,
        inspection_included: true,
      },
    },
    {
      tier_code: 'TIER_6',
      name: 'Full Estate Coverage (AC Comprehensive)',
      price: 899,
      coverage_rules: {
        categories: ['ELECTRICAL', 'PLUMBING', 'FAN', 'PUMP', 'GEYSER', 'RO', 'AC'],
        annual_visits: 18,
        emergency_priority: true,
        labour_covered: true,
        inspection_included: true,
      },
    },
    {
      tier_code: 'TIER_7',
      name: 'VIP Ultra Protection Plan (24/7 Priority Emergency)',
      price: 999,
      coverage_rules: {
        categories: ['ELECTRICAL', 'PLUMBING', 'FAN', 'PUMP', 'GEYSER', 'RO', 'AC', 'OTHER'],
        annual_visits: 99,
        emergency_priority: true,
        labour_covered: true,
        inspection_included: true,
      },
    },
  ];

  for (const plan of plans) {
    await prisma.membershipPlan.upsert({
      where: { tier_code: plan.tier_code },
      update: { name: plan.name, price: plan.price, coverage_rules: plan.coverage_rules },
      create: plan,
    });
  }
  console.log('7 Membership Plans seeded successfully.');

  // 3. Seed Sample Technicians
  const techPasswordHash = await bcrypt.hash('TechPassword123!', 10);
  const sampleTechs = [
    {
      phone: '9876543210',
      name: 'Rajesh Kumar',
      password_hash: techPasswordHash,
      kyc_status: KycStatus.VERIFIED,
      skills: [SkillCategory.ELECTRICAL, SkillCategory.FAN, SkillCategory.AC],
      service_area: ['721602', '721607', 'Haldia', 'Sutahata'],
    },
    {
      phone: '9876543211',
      name: 'Amitabh Roy',
      password_hash: techPasswordHash,
      kyc_status: KycStatus.VERIFIED,
      skills: [SkillCategory.PLUMBING, SkillCategory.PUMP, SkillCategory.GEYSER],
      service_area: ['721602', '721657', 'Haldia', 'Durgachak'],
    },
    {
      phone: '9876543212',
      name: 'Subhash Das',
      password_hash: techPasswordHash,
      kyc_status: KycStatus.VERIFIED,
      skills: [SkillCategory.RO, SkillCategory.AC, SkillCategory.ELECTRICAL],
      service_area: ['721602', 'Haldia'],
    },
  ];

  for (const tech of sampleTechs) {
    await prisma.technician.upsert({
      where: { phone: tech.phone },
      update: {},
      create: tech,
    });
  }
  console.log('Sample technicians seeded.');

  // 4. Seed Reward Catalog Items
  const rewards = [
    {
      title: '₹200 Off Next Spare Part Invoice',
      description: 'Redeem 500 points for ₹200 discount on billable spare parts.',
      points_required: 500,
      partner_name: 'Home Maintenance Platform',
    },
    {
      title: 'Free RO Sediment Filter Replacement',
      description: 'Redeem 800 points for a free genuine sediment filter replacement.',
      points_required: 800,
      partner_name: 'Kent / Aquaguard Genuine Parts',
    },
    {
      title: '₹500 Flipkart Gift Card',
      description: 'Redeem 1200 points for an e-gift voucher.',
      points_required: 1200,
      partner_name: 'Flipkart Rewards',
    },
  ];

  for (const r of rewards) {
    const existing = await prisma.rewardCatalogItem.findFirst({
      where: { title: r.title },
    });
    if (!existing) {
      await prisma.rewardCatalogItem.create({ data: r });
    }
  }
  console.log('Reward Catalog items seeded.');

  console.log('Database seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
