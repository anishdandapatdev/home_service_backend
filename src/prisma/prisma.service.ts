import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Database connection established successfully');
    } catch (error) {
      this.logger.warn(
        `⚠️  Database not reachable: ${error.message}. ` +
          'The server will continue running (Swagger UI available), but DB-dependent endpoints will fail. ' +
          'Run: docker compose up -d  to start PostgreSQL & Redis.',
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
