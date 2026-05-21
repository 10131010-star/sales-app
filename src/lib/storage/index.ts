import { isSupabaseConfigured } from '@/lib/supabase/client';
import type { DataRepository } from './repository';
import { LocalStorageRepository } from './localStorageRepo';
import { SupabaseRepository } from './supabaseRepo';

export type StorageMode = 'local' | 'supabase';

/** Supabase 未設定時は localStorage、設定済みなら Supabase を使用 */
export function createRepository(): DataRepository {
  if (isSupabaseConfigured()) {
    return new SupabaseRepository();
  }
  return new LocalStorageRepository();
}

export function getStorageMode(): StorageMode {
  return isSupabaseConfigured() ? 'supabase' : 'local';
}

export type { DataRepository } from './repository';
export { LOCAL_STORAGE_KEY } from './localStorageRepo';
