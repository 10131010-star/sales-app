import type { DataRepository } from './repository';
import { LocalStorageRepository } from './localStorageRepo';
import { SupabaseRepository } from './supabaseRepo';

export function createRepository(): DataRepository {
  if (import.meta.env.VITE_USE_SUPABASE === 'true') {
    return new SupabaseRepository();
  }
  return new LocalStorageRepository();
}

export { STORAGE_KEY } from './repository';
export type { DataRepository } from './repository';
