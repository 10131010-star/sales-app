import type { AppData } from '@/data/types';

export interface DataRepository {
  load(): Promise<AppData>;
  save(data: AppData): Promise<void>;
}

export const STORAGE_KEY = 'sales-app:v1';
