import type { SalesLog } from '@/data/salesLog/types';
import type { StoreReview } from '@/data/reviews/types';
import type { AppData, KnowledgeItem, SalesRecord, SalesTarget, Store } from '@/data/types';

export interface DataRepository {
  load(): Promise<AppData>;
  upsertStore(store: Store): Promise<Store>;
  deleteStore(id: string): Promise<void>;
  upsertRecord(record: SalesRecord): Promise<SalesRecord>;
  deleteRecord(id: string): Promise<void>;
  upsertSalesLog(log: SalesLog): Promise<SalesLog>;
  deleteSalesLog(id: string): Promise<void>;
  upsertStoreReview(review: StoreReview): Promise<StoreReview>;
  deleteStoreReview(id: string): Promise<void>;
  upsertTarget(target: SalesTarget): Promise<SalesTarget>;
  upsertKnowledge(item: KnowledgeItem): Promise<KnowledgeItem>;
  deleteKnowledge(id: string): Promise<void>;
  seedKnowledgeIfEmpty(items: KnowledgeItem[]): Promise<void>;
}
