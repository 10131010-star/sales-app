import { isSupabaseConfigured } from '@/lib/supabase/client';
import type { AppData } from '@/data/types';
import type { RagContext, RagRetrievalQuery } from '@/data/rag/types';
import { retrieveRagContextLocal } from '@/lib/rag/retrieverLocal';
import { retrieveRagContextSupabase, seedRagTablesIfEmpty } from '@/lib/rag/retrieverSupabase';

export type { RagContext, RagChunk, RagEvidence, RagRetrievalQuery, StoreAnalysisWithRag } from '@/data/rag/types';

export async function retrieveRagContext(
  data: AppData,
  query: RagRetrievalQuery,
): Promise<RagContext> {
  if (isSupabaseConfigured()) {
    try {
      await seedRagTablesIfEmpty();
      const remote = await retrieveRagContextSupabase(query);
      if (remote && remote.chunks.length > 0) return remote;
    } catch {
      /* fallback local */
    }
  }
  return retrieveRagContextLocal(data, query);
}
