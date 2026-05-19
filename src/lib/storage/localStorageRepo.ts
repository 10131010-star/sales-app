import { SEED_DATA } from '@/data/seed';
import type { AppData } from '@/data/types';
import type { DataRepository } from './repository';
import { STORAGE_KEY } from './repository';

export class LocalStorageRepository implements DataRepository {
  async load(): Promise<AppData> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        await this.save(SEED_DATA);
        return structuredClone(SEED_DATA);
      }
      return JSON.parse(raw) as AppData;
    } catch {
      return structuredClone(SEED_DATA);
    }
  }

  async save(data: AppData): Promise<void> {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
}
