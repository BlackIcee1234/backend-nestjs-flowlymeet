import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

@Injectable()
export class DatabaseConfig {
  private readonly prisma: PrismaClient;
  private readonly pool: Pool;

  constructor(private configService: ConfigService) {
    // Initialize Prisma client with direct URL for migrations
    const databaseUrl = this.configService.get<string>('DATABASE_URL');
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });

    // Initialize PostgreSQL pool with connection string
    this.pool = new Pool({
      connectionString: databaseUrl,
    });
  }

  getPrisma() {
    return this.prisma;
  }

  getPool() {
    return this.pool;
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
    await this.pool.end();
  }
}