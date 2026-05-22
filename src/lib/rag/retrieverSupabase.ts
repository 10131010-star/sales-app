import { inferBenchmarkSegment } from '@/data/analysis/segment';
import { ALL_KNOWLEDGE_SEED } from '@/data/knowledge';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client';
import type { RagChunk, RagContext, RagRetrievalQuery } from '@/data/rag/types';
import { buildQueryTerms, scoreText } from '@/lib/rag/search';

const DEFAULT_LIMIT = 5;

function rowToChunk(
  sourceType: RagChunk['sourceType'],
  id: string,
  title: string,
  excerpt: string,
  score: number,
  metadata: Record<string, string> = {},
): RagChunk {
  return { id, sourceType, title, excerpt, score, metadata };
}

export async function retrieveRagContextSupabase(query: RagRetrievalQuery): Promise<RagContext | null> {
  if (!isSupabaseConfigured()) return null;

  const { input, storeId } = query;
  const limit = query.limitPerSource ?? DEFAULT_LIMIT;
  const queryTerms = buildQueryTerms(input);
  const sb = getSupabase();

  const segment = inferBenchmarkSegment(input);
  const [benchRes, knowRes, logRes, objRes, revRes] = await Promise.all([
    sb
      .from('benchmarks')
      .select('*')
      .eq('area', input.area)
      .eq('business_type', input.businessType)
      .eq('segment', segment)
      .maybeSingle(),
    sb
      .from('knowledge')
      .select('*')
      .or(
        `areas.cs.{${input.area}},business_types.cs.{${input.businessType}},search_text.ilike.%${input.businessType}%`,
      )
      .limit(limit * 2),
    storeId
      ? sb.from('sales_logs').select('*').eq('store_id', storeId).order('visited_at', { ascending: false }).limit(limit)
      : sb
          .from('sales_logs')
          .select('*')
          .eq('area', input.area)
          .order('visited_at', { ascending: false })
          .limit(limit),
    sb.from('objections').select('*').limit(limit * 2),
    storeId
      ? sb.from('reviews').select('*').eq('store_id', storeId).limit(limit)
      : sb.from('reviews').select('*').eq('area', input.area).limit(limit),
  ]);

  const benchmarks: RagChunk[] = [];
  if (benchRes.data) {
    const b = benchRes.data;
    benchmarks.push(
      rowToChunk(
        'benchmark',
        b.id,
        `${b.area}・${b.business_type} 上位${b.sample_size}店`,
        `単価¥${b.avg_unit_price} 商品${b.avg_product_count} セット${b.avg_set_rate}% 深夜${b.avg_late_night_rate}% ★${b.avg_review_score}`,
        1,
        { source: b.data_source_note },
      ),
    );
  }

  const scoreRow = (text: string) => scoreText(queryTerms, text);

  const knowledge: RagChunk[] = (knowRes.data ?? [])
    .map((k) => ({
      row: k,
      score: scoreText(queryTerms, k.search_text || `${k.title} ${k.summary} ${k.talk_script}`),
    }))
    .filter((x) => x.score > 0.05)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ row: k, score }) =>
      rowToChunk('knowledge', k.id, `${k.category}: ${k.title}`, (k.summary || k.talk_script).slice(0, 200), score, {
        category: k.category,
      }),
    );

  const salesLogs: RagChunk[] = (logRes.data ?? []).map((l) =>
    rowToChunk(
      'sales_log',
      l.id,
      `${new Date(l.visited_at).toLocaleDateString('ja-JP')} · ${l.outcome ?? '保留'}`,
      [
        l.hit_proposal && `刺さった: ${l.hit_proposal}`,
        l.disliked_point && `嫌がった: ${l.disliked_point}`,
        l.owner_reaction && `反応: ${l.owner_reaction}`,
        l.objection_heard && `断り: ${l.objection_heard}`,
        l.next_action && `次回: ${l.next_action}`,
      ]
        .filter(Boolean)
        .join(' / ')
        .slice(0, 220) || l.quick_memo,
      scoreRow(l.search_text || l.negotiation_memo),
      {
        memberId: l.member_id,
        outcome: l.outcome,
        hitProposal: l.hit_proposal,
        nextAction: l.next_action,
        date: new Date(l.visited_at).toLocaleDateString('ja-JP'),
      },
    ),
  );

  const objections: RagChunk[] = (objRes.data ?? [])
    .map((o) => ({
      row: o,
      score: scoreText(queryTerms, o.search_text || `${o.objection} ${o.rebuttal}`),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ row: o, score }) =>
      rowToChunk('objection', o.id, o.objection.slice(0, 40), o.rebuttal.slice(0, 200), score),
    );

  const reviews: RagChunk[] = (revRes.data ?? []).map((r) =>
    rowToChunk(
      'review',
      r.id,
      `口コミ ★${r.rating} · ${r.delivery_fit ?? ''}`,
      [r.summary, r.delivery_fit_note].filter(Boolean).join(' ').slice(0, 220),
      scoreRow(r.search_text || r.summary),
      {
        rating: String(r.rating),
        deliveryFit: r.delivery_fit,
        dimensionSummary: r.summary,
      },
    ),
  );

  const chunks = [...benchmarks, ...knowledge, ...salesLogs, ...objections, ...reviews].sort(
    (a, b) => b.score - a.score,
  );

  return {
    chunks,
    benchmarks,
    knowledge,
    salesLogs,
    objections,
    reviews,
    queryTerms,
    retrievedAt: new Date().toISOString(),
  };
}

/** ベンチマーク・ナレッジ等を Supabase に同期（初回用） */
export async function seedRagTablesIfEmpty(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const sb = getSupabase();

  const { count: benchCount } = await sb.from('benchmarks').select('*', { count: 'exact', head: true });
  if ((benchCount ?? 0) === 0) {
    const { BENCHMARKS: benchMap } = await import('@/data/analysis/benchmarks');
    const { SEGMENT_BENCHMARKS: segMap } = await import('@/data/analysis/benchmarks');
    const baseRows = Object.values(benchMap).map((b) => ({
      area: b.area,
      business_type: b.businessType,
      segment: 'standard',
      segment_label: '',
      sample_size: b.sampleSize,
      avg_unit_price: b.avgUnitPrice,
      avg_product_count: b.avgProductCount,
      avg_set_rate: b.avgSetRate,
      avg_late_night_rate: b.avgLateNightRate,
      avg_review_score: b.avgReviewScore,
      data_source_note: b.dataSourceNote,
      search_text: `${b.area} ${b.businessType} ベンチマーク 上位店`.toLowerCase(),
    }));
    const segRows = Object.values(segMap).map((b) => ({
      area: b.area,
      business_type: b.businessType,
      segment: b.segment ?? 'standard',
      segment_label: b.segmentLabel ?? '',
      sample_size: b.sampleSize,
      avg_unit_price: b.avgUnitPrice,
      avg_product_count: b.avgProductCount,
      avg_set_rate: b.avgSetRate,
      avg_late_night_rate: b.avgLateNightRate,
      avg_review_score: b.avgReviewScore,
      data_source_note: b.dataSourceNote,
      search_text: `${b.area} ${b.businessType} ${b.segmentLabel} ベンチマーク`.toLowerCase(),
    }));
    await sb.from('benchmarks').upsert([...baseRows, ...segRows]);
  }

  const { count: knowCount } = await sb.from('knowledge').select('*', { count: 'exact', head: true });
  if ((knowCount ?? 0) === 0) {
    const rows = ALL_KNOWLEDGE_SEED.map((k) => ({
      id: k.id,
      category: k.category,
      title: k.title,
      summary: k.summary,
      talk_script: k.talkScript,
      tags: k.tags,
      business_types: [] as string[],
      areas: [] as string[],
      search_text: [k.title, k.category, k.summary, k.talkScript, ...(k.tags ?? [])].join(' ').toLowerCase(),
      created_by: k.createdBy,
    }));
    await sb.from('knowledge').upsert(rows);
  }

  const { count: objCount } = await sb.from('objections').select('*', { count: 'exact', head: true });
  if ((objCount ?? 0) === 0) {
    const rows = ALL_KNOWLEDGE_SEED.filter((k) => k.category === '切り返し').map((k) => ({
      id: k.id,
      objection: k.title,
      rebuttal: k.talkScript.slice(0, 2000),
      business_types: [] as string[],
      tags: k.tags,
      search_text: [k.title, k.talkScript, k.ngExample, ...(k.tags ?? [])].join(' ').toLowerCase(),
      created_by: k.createdBy,
    }));
    if (rows.length > 0) await sb.from('objections').upsert(rows);
  }
}
