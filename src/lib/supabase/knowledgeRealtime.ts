import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { mapKnowledge } from '@/lib/supabase/mappers';
import type { KnowledgeItem } from '@/data/types';

export type KnowledgeRealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE';

export interface KnowledgeRealtimePayload {
  event: KnowledgeRealtimeEvent;
  item?: KnowledgeItem;
  deletedId?: string;
}

type Handler = (payload: KnowledgeRealtimePayload) => void;

/** knowledge_items の INSERT / UPDATE / DELETE を購読 */
export function subscribeKnowledgeRealtime(onChange: Handler): () => void {
  if (!isSupabaseConfigured()) return () => undefined;

  const sb = getSupabase();
  const channel = sb
    .channel('knowledge_items_realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'knowledge_items' },
      (payload) => {
        const event = payload.eventType as KnowledgeRealtimeEvent;
        if (event === 'DELETE') {
          const old = payload.old as Record<string, unknown> | undefined;
          const deletedId = old?.id ? String(old.id) : undefined;
          if (deletedId) onChange({ event, deletedId });
          return;
        }
        const row = payload.new as Record<string, unknown> | undefined;
        if (!row?.id) return;
        onChange({ event, item: mapKnowledge(row) });
      },
    )
    .subscribe();

  return () => {
    void sb.removeChannel(channel);
  };
}
