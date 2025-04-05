import { Module } from '@nestjs/common';
import { DatabaseConfig } from './database.config';

@Module({
  providers: [DatabaseConfig],
  exports: [DatabaseConfig]
})
export class DatabaseModule {} 