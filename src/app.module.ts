import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';

import { PrismaModule } from './prisma/prisma.module';
import { NotificationsModule } from './notifications/notifications.module';
import { UploadModule } from './upload/upload.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PlansModule } from './plans/plans.module';
import { MembershipsModule } from './memberships/memberships.module';
import { InspectionsModule } from './inspections/inspections.module';
import { ServiceRequestsModule } from './service-requests/service-requests.module';
import { SparePartsModule } from './spare-parts/spare-parts.module';
import { InvoicesModule } from './invoices/invoices.module';
import { PaymentsModule } from './payments/payments.module';
import { RewardsModule } from './rewards/rewards.module';
import { ComplaintsModule } from './complaints/complaints.module';
import { AdminModule } from './admin/admin.module';
import { PublicModule } from './public/public.module';
import { JobsModule } from './jobs/jobs.module';
import { LocationModule } from './location/location.module';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    NotificationsModule,
    UploadModule,
    AuthModule,
    UsersModule,
    PlansModule,
    MembershipsModule,
    InspectionsModule,
    ServiceRequestsModule,
    SparePartsModule,
    InvoicesModule,
    PaymentsModule,
    RewardsModule,
    ComplaintsModule,
    AdminModule,
    PublicModule,
    JobsModule,
    LocationModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
