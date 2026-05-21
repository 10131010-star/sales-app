import type { AppData, KnowledgeItem, SalesRecord, SalesTarget, Store } from '@/data/types';
import { uid } from '@/lib/utils';
import type { DataRepository } from './repository';

export const LOCAL_STORAGE_KEY = 'sales-app:v2:data';

const EMPTY_DATA: AppData = {
  stores: [],
  salesRecords: [],
  salesTargets: [],
  knowledgeItems: [],
};

export class LocalStorageRepository implements DataRepository {
  private async read(): Promise<AppData> {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) return structuredClone(EMPTY_DATA);
      const parsed = JSON.parse(raw) as AppData;
      return {
        stores: parsed.stores ?? [],
        salesRecords: parsed.salesRecords ?? [],
        salesTargets: parsed.salesTargets ?? [],
        knowledgeItems: parsed.knowledgeItems ?? [],
      };
    } catch {
      return structuredClone(EMPTY_DATA);
    }
  }

  private async write(data: AppData): Promise<void> {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  }

  async load(): Promise<AppData> {
    return this.read();
  }

  async upsertStore(store: Store): Promise<Store> {
    const data = await this.read();
    const now = new Date().toISOString();
    const id = store.id || uid();
    const saved: Store = {
      ...store,
      id,
      createdAt: store.createdAt || now,
      updatedAt: now,
    };
    const idx = data.stores.findIndex((s) => s.id === id);
    if (idx >= 0) data.stores[idx] = saved;
    else data.stores.unshift(saved);
    await this.write(data);
    return saved;
  }

  async deleteStore(id: string): Promise<void> {
    const data = await this.read();
    data.stores = data.stores.filter((s) => s.id !== id);
    await this.write(data);
  }

  async upsertRecord(record: SalesRecord): Promise<SalesRecord> {
    const data = await this.read();
    const now = new Date().toISOString();
    const id = record.id || uid();
    const saved: SalesRecord = {
      ...record,
      id,
      createdAt: record.createdAt || now,
      updatedAt: now,
    };
    const idx = data.salesRecords.findIndex((r) => r.id === id);
    if (idx >= 0) data.salesRecords[idx] = saved;
    else data.salesRecords.unshift(saved);
    await this.write(data);
    return saved;
  }

  async deleteRecord(id: string): Promise<void> {
    const data = await this.read();
    data.salesRecords = data.salesRecords.filter((r) => r.id !== id);
    await this.write(data);
  }

  async upsertTarget(target: SalesTarget): Promise<SalesTarget> {
    const data = await this.read();
    const now = new Date().toISOString();
    const idx = target.id
      ? data.salesTargets.findIndex((t) => t.id === target.id)
      : data.salesTargets.findIndex(
          (t) =>
            t.periodType === target.periodType &&
            t.periodKey === target.periodKey &&
            t.memberId === target.memberId,
        );
    const id = idx >= 0 ? data.salesTargets[idx].id : target.id || uid();
    const saved: SalesTarget = { ...target, id, updatedAt: now };
    if (idx >= 0) data.salesTargets[idx] = saved;
    else data.salesTargets.push(saved);
    await this.write(data);
    return saved;
  }

  async upsertKnowledge(item: KnowledgeItem): Promise<KnowledgeItem> {
    const data = await this.read();
    const now = new Date().toISOString();
    const id = item.id || uid();
    const saved: KnowledgeItem = {
      ...item,
      id,
      createdAt: item.createdAt || now,
      updatedAt: now,
    };
    const idx = data.knowledgeItems.findIndex((k) => k.id === id);
    if (idx >= 0) data.knowledgeItems[idx] = saved;
    else data.knowledgeItems.unshift(saved);
    await this.write(data);
    return saved;
  }

  async deleteKnowledge(id: string): Promise<void> {
    const data = await this.read();
    data.knowledgeItems = data.knowledgeItems.filter((k) => k.id !== id);
    await this.write(data);
  }

  async seedKnowledgeIfEmpty(items: KnowledgeItem[]): Promise<void> {
    const data = await this.read();
    if (data.knowledgeItems.length > 0) return;
    data.knowledgeItems = items;
    await this.write(data);
  }
}
