import type { AppData } from '@/data/types';
import type { DataRepository } from './repository';

/**
 * 将来の Supabase 連携用スタブ。
 * 環境変数 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY を設定後、実装を差し替えてください。
 */
export class SupabaseRepository implements DataRepository {
  constructor(
    private readonly _url = import.meta.env.VITE_SUPABASE_URL as string | undefined,
    private readonly _key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined,
  ) {}

  async load(): Promise<AppData> {
    if (!this._url || !this._key) {
      throw new Error('Supabase credentials not configured. Use LocalStorageRepository or set env vars.');
    }
    // TODO: supabase.from('app_data').select() などに置き換え
    throw new Error('SupabaseRepository not implemented yet');
  }

  async save(_data: AppData): Promise<void> {
    if (!this._url || !this._key) {
      throw new Error('Supabase credentials not configured');
    }
    throw new Error('SupabaseRepository not implemented yet');
  }
}

