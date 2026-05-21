import { isSupabaseConfigured } from '@/lib/supabase/client';
import type { DataRepository } from './repository';
import { SupabaseRepository } from './supabaseRepo';

export function createRepository(): DataRepository {
  if (!isSupabaseConfigured()) {
    throw new Error('SUPABASE_NOT_CONFIGURED');
  }
  return new SupabaseRepository();
}

export type { DataRepository } from './repository';
