import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { supabaseProvider, SUPABASE_CLIENT, SupabaseService } from '../../config/supabase.config';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { UserRepository } from './user.repository';
import { UserService } from './services/user.service';
import { DatabaseModule } from '../../config/database.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule
  ],
  providers: [
    SupabaseService,
    supabaseProvider,
    SupabaseAuthGuard,
    UserRepository,
    UserService
  ],
  exports: [
    SupabaseAuthGuard, 
    SUPABASE_CLIENT,
    UserService
  ],
})
export class AuthModule {}