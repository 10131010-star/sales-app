import { getSupabase } from '@/lib/supabase/client';
import {
  knowledgeToRow,
  mapKnowledge,
  mapRecord,
  mapStore,
  mapTarget,
  recordToRow,
  storeToRow,
  targetToRow,
} from '@/lib/supabase/mappers';
import { filterNewKnowledgeItems } from '@/data/seedKnowledge';
import type { AppData, KnowledgeItem, SalesRecord, SalesTarget, Store } from '@/data/types';
import type { DataRepository } from './repository';

export class SupabaseRepository implements DataRepository {
  async load(): Promise<AppData> {
    const sb = getSupabase();
    const [storesRes, recordsRes, targetsRes, knowledgeRes] = await Promise.all([
      sb.from('stores').select('*').order('updated_at', { ascending: false }),
      sb.from('sales_records').select('*').order('record_date', { ascending: false }),
      sb.from('sales_targets').select('*'),
      sb.from('knowledge_items').select('*').order('updated_at', { ascending: false }),
    ]);

    if (storesRes.error) throw storesRes.error;
    if (recordsRes.error) throw recordsRes.error;
    if (targetsRes.error) throw targetsRes.error;
    if (knowledgeRes.error) throw knowledgeRes.error;

    return {
      stores: (storesRes.data ?? []).map(mapStore),
      salesRecords: (recordsRes.data ?? []).map(mapRecord),
      salesTargets: (targetsRes.data ?? []).map(mapTarget),
      knowledgeItems: (knowledgeRes.data ?? []).map(mapKnowledge),
    };
  }

  async upsertStore(store: Store): Promise<Store> {
    const sb = getSupabase();
    const row = storeToRow(store);
    const query = store.id
      ? sb.from('stores').upsert({ id: store.id, ...row }).select().single()
      : sb.from('stores').insert(row).select().single();
    const { data, error } = await query;
    if (error) throw error;
    return mapStore(data);
  }

  async deleteStore(id: string): Promise<void> {
    const { error } = await getSupabase().from('stores').delete().eq('id', id);
    if (error) throw error;
  }

  async upsertRecord(record: SalesRecord): Promise<SalesRecord> {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('sales_records')
      .upsert({ id: record.id, ...recordToRow(record) })
      .select()
      .single();
    if (error) throw error;
    return mapRecord(data);
  }

  async deleteRecord(id: string): Promise<void> {
    const { error } = await getSupabase().from('sales_records').delete().eq('id', id);
    if (error) throw error;
  }

  async upsertTarget(target: SalesTarget): Promise<SalesTarget> {
    const sb = getSupabase();
    const payload = target.id ? { id: target.id, ...targetToRow(target) } : targetToRow(target);
    const { data, error } = await sb
      .from('sales_targets')
      .upsert(payload, { onConflict: 'period_type,period_key,member_id' })
      .select()
      .single();
    if (error) throw error;
    return mapTarget(data);
  }

  async upsertKnowledge(item: KnowledgeItem): Promise<KnowledgeItem> {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('knowledge_items')
      .upsert({ id: item.id, ...knowledgeToRow(item) })
      .select()
      .single();
    if (error) throw error;
    return mapKnowledge(data);
  }

  async deleteKnowledge(id: string): Promise<void> {
    const { error } = await getSupabase().from('knowledge_items').delete().eq('id', id);
    if (error) throw error;
  }

  async seedKnowledgeIfEmpty(items: KnowledgeItem[]): Promise<void> {
    const sb = getSupabase();
    const { data: existing, error } = await sb.from('knowledge_items').select('category, title');
    if (error) throw error;
    const fresh = filterNewKnowledgeItems(
      (existing ?? []).map((r) => ({
        id: '',
        category: r.category as KnowledgeItem['category'],
        title: r.title,
        summary: '',
        talkScript: '',
        customerPsychology: '',
        ngExample: '',
        successPoint: '',
        nextAction: '',
        tags: [],
        favorite: false,
        createdBy: 'system',
        createdAt: '',
        updatedAt: '',
      })),
      items,
    );
    if (fresh.length === 0) return;
    const rows = fresh.map((k) => ({
      id: k.id,
      ...knowledgeToRow(k),
      created_at: k.createdAt,
      updated_at: k.updatedAt,
    }));
    const { error: insertError } = await sb
      .from('knowledge_items')
      .upsert(rows, { onConflict: 'category,title', ignoreDuplicates: true });
    if (insertError) throw insertError;
  }
}
