import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

export const SUPABASE_CLIENT = 'SUPABASE_CLIENT';

@Injectable()
export class SupabaseService {
  private client: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration is missing');
    }

    this.client = createClient(supabaseUrl, supabaseKey);
  }

  getClient(): SupabaseClient {
    return this.client;
  }
}

export const supabaseProvider = {
  provide: SUPABASE_CLIENT,
  useFactory: (supabaseService: SupabaseService) => {
    return supabaseService.getClient();
  },
  inject: [SupabaseService],
}; 