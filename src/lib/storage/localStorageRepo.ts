import type { SalesLog } from '@/data/salesLog/types';
import type { StoreReview } from '@/data/reviews/types';
import type { AppData, KnowledgeItem, SalesRecord, SalesTarget, Store } from '@/data/types';
import { KNOWLEDGE_CATEGORIES } from '@/data/constants';
import { filterNewKnowledgeItems } from '@/data/seedKnowledge';
import { uid } from '@/lib/utils';
import type { DataRepository } from './repository';

export const LOCAL_STORAGE_KEY = 'sales-app:v2:data';

const EMPTY_DATA: AppData = {
  stores: [],
  salesRecords: [],
  salesLogs: [],
  storeReviews: [],
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
        salesLogs: parsed.salesLogs ?? [],
        storeReviews: parsed.storeReviews ?? [],
        salesTargets: parsed.salesTargets ?? [],
        knowledgeItems: (parsed.knowledgeItems ?? []).map((k) => migrateKnowledgeItem(k as KnowledgeItem & Record<string, unknown>)),
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

  async upsertSalesLog(log: SalesLog): Promise<SalesLog> {
    const data = await this.read();
    const now = new Date().toISOString();
    const id = log.id || uid();
    const saved: SalesLog = { ...log, id, createdAt: log.createdAt || now, updatedAt: now };
    const idx = data.salesLogs.findIndex((l) => l.id === id);
    if (idx >= 0) data.salesLogs[idx] = saved;
    else data.salesLogs.unshift(saved);
    await this.write(data);
    return saved;
  }

  async deleteSalesLog(id: string): Promise<void> {
    const data = await this.read();
    data.salesLogs = data.salesLogs.filter((l) => l.id !== id);
    await this.write(data);
  }

  async upsertStoreReview(review: StoreReview): Promise<StoreReview> {
    const data = await this.read();
    const now = new Date().toISOString();
    const id = review.id || uid();
    const saved: StoreReview = {
      ...review,
      id,
      analyzedAt: review.analyzedAt || now,
      createdAt: review.createdAt || now,
      updatedAt: now,
    };
    const idx = data.storeReviews.findIndex((r) => r.id === id);
    if (idx >= 0) data.storeReviews[idx] = saved;
    else data.storeReviews.unshift(saved);
    await this.write(data);
    return saved;
  }

  async deleteStoreReview(id: string): Promise<void> {
    const data = await this.read();
    data.storeReviews = data.storeReviews.filter((r) => r.id !== id);
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
    const fresh = filterNewKnowledgeItems(data.knowledgeItems, items);
    if (fresh.length === 0) return;
    data.knowledgeItems = [...fresh, ...data.knowledgeItems];
    await this.write(data);
  }
}

/** 旧ナレッジ形式 → 新形式 */
function migrateKnowledgeItem(raw: KnowledgeItem & Record<string, unknown>): KnowledgeItem {
  if (typeof raw.talkScript === 'string') return raw as KnowledgeItem;
  const legacy = raw as Record<string, unknown>;
  const categoryRaw = String(legacy.category ?? '切り返し');
  const category = (KNOWLEDGE_CATEGORIES as readonly string[]).includes(categoryRaw)
    ? (categoryRaw as KnowledgeItem['category'])
    : '切り返し';
  const parts = [
    legacy.objection ? `【断り】${legacy.objection}` : '',
    legacy.rebuttal ? `【切り返し】${legacy.rebuttal}` : '',
    legacy.successTalk ? `【成功】${legacy.successTalk}` : '',
  ].filter(Boolean);
  return {
    id: String(legacy.id ?? uid()),
    category,
    title: String(legacy.title ?? '無題'),
    summary: String(legacy.memo ?? legacy.usageScene ?? ''),
    talkScript: parts.join('\n\n') || String(legacy.memo ?? ''),
    customerPsychology: '',
    ngExample: String(legacy.ngTalk ?? ''),
    successPoint: String(legacy.successTalk ?? ''),
    nextAction: '',
    tags: Array.isArray(legacy.tags) ? (legacy.tags as string[]) : [],
    favorite: Boolean(legacy.favorite),
    createdBy: String(legacy.registrantId ?? legacy.createdBy ?? 'system'),
    viewCount: Number(legacy.viewCount ?? 0),
    useCount: Number(legacy.useCount ?? 0),
    createdAt: String(legacy.createdAt ?? new Date().toISOString()),
    updatedAt: String(legacy.updatedAt ?? new Date().toISOString()),
  };
}
