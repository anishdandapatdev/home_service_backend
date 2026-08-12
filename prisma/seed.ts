import { PrismaClient, PaymentReferenceType, PaymentStatus, NotificationChannel } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Quickox platform database...');

  // 1. Seed Customer User
  const user = await prisma.user.upsert({
    where: { phone: '+919876543210' },
    update: {},
    create: {
      phone: '+919876543210',
      name: 'Anish Customer',
      email: 'customer@quickox.com',
      is_active: true,
    },
  });
  console.log(`Customer created: ${user.phone}`);

  // 2. Seed Sample Payment
  const payment = await prisma.payment.upsert({
    where: { razorpay_order_id: 'order_demo_1001' },
    update: {},
    create: {
      user_id: user.id,
      amount: 499,
      reference_type: PaymentReferenceType.MEMBERSHIP,
      reference_id: 'REF_MEMBERSHIP_TIER_2',
      razorpay_order_id: 'order_demo_1001',
      razorpay_payment_id: 'pay_demo_1001',
      razorpay_signature: 'dummy_sig_1001',
      status: PaymentStatus.SUCCESS,
    },
  });
  console.log(`Payment created: ${payment.razorpay_order_id}`);

  // 3. Seed Sample Invoice
  const invoice = await prisma.invoice.create({
    data: {
      user_id: user.id,
      title: 'Home Electrical & Plumbing Annual Invoice',
      description: 'Annual membership service invoice',
      amount: 499,
      tax: 89.82,
      grand_total: 588.82,
      pdf_url: 'https://res.cloudinary.com/demo/image/upload/v1/quickox_invoices/INV_1001.pdf',
    },
  });
  console.log(`Invoice created: ${invoice.id}`);

  // 4. Seed Notification
  const notification = await prisma.notification.create({
    data: {
      user_id: user.id,
      channel: NotificationChannel.SMS,
      title: 'Welcome to Quickox',
      body: 'Your account has been successfully verified.',
    },
  });
  console.log(`Notification created: ${notification.id}`);

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
