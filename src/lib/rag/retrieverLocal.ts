import { BENCHMARKS, SEGMENT_BENCHMARKS, formatBenchmarkCondition, resolveBenchmarkFromInput } from '@/data/analysis/benchmarks';
import { inferBenchmarkSegment } from '@/data/analysis/segment';
import { ALL_KNOWLEDGE_SEED } from '@/data/knowledge';
import { REVIEW_DIMENSION_LABELS } from '@/data/reviews/types';
import { salesLogSearchText, type SalesLog } from '@/data/salesLog/types';
import type { StoreReview } from '@/data/reviews/types';
import type { AppData, KnowledgeItem } from '@/data/types';
import type { RagChunk, RagContext, RagRetrievalQuery } from '@/data/rag/types';
import { matchObjectionsWithSuccessCases } from '@/lib/rag/objectionMatcher';
import { buildQueryTerms, rankDocuments } from '@/lib/rag/search';

const DEFAULT_LIMIT = 5;

function chunkFromBenchmark(input: RagRetrievalQuery['input'], score: number): RagChunk {
  const segment = inferBenchmarkSegment(input);
  const { profile, matchLevel, priceBand } = resolveBenchmarkFromInput(input, segment);
  const condition = formatBenchmarkCondition(input.area, input.businessType, segment, priceBand);
  return {
    id: `bench-${input.area}-${input.businessType}-${segment}`,
    sourceType: 'benchmark',
    title: `${condition} 上位${profile.sampleSize}店`,
    excerpt: `単価¥${profile.avgUnitPrice} / 商品${profile.avgProductCount}品 / セット${profile.avgSetRate}% / 深夜${profile.avgLateNightRate}% / ★${profile.avgReviewScore} — ${profile.dataSourceNote}`,
    score,
    metadata: {
      matchLevel,
      sampleSize: String(profile.sampleSize),
      area: input.area,
      businessType: input.businessType,
      segment,
      updatedAt: profile.updatedAt,
    },
  };
}

function knowledgeToChunks(items: KnowledgeItem[], queryTerms: string[], limit: number): RagChunk[] {
  const ranked = rankDocuments(
    items,
    (k) => [k.title, k.category, k.summary, k.talkScript, k.tags.join(' ')].join(' '),
    queryTerms,
    limit,
  );
  return ranked.map(({ item: k, score }) => ({
    id: k.id,
    sourceType: 'knowledge' as const,
    title: `${k.category}: ${k.title}`,
    excerpt: k.summary || k.talkScript.slice(0, 200),
    score,
    metadata: { category: k.category, tags: k.tags.join(',') },
  }));
}

function salesLogsToChunks(
  logs: SalesLog[],
  storeId: string | undefined,
  queryTerms: string[],
  limit: number,
): RagChunk[] {
  const filtered = storeId
    ? logs.filter((l) => l.storeId === storeId)
    : logs.filter((l) => queryTerms.some((t) => l.area.includes(t) || l.businessType.includes(t)));

  const ranked = rankDocuments(filtered, (l) => salesLogSearchText(l), queryTerms, limit);

  return ranked.map(({ item: l, score }) => ({
    id: l.id,
    sourceType: 'sales_log' as const,
    title: `${l.visitedAt.slice(0, 10)} · ${l.outcome}`,
    excerpt: [
      l.hitProposal && `刺さった: ${l.hitProposal}`,
      l.dislikedPoint && `嫌がった: ${l.dislikedPoint}`,
      l.ownerReaction && `反応: ${l.ownerReaction}`,
      l.objectionHeard && `断り: ${l.objectionHeard}`,
      l.nextAction && `次回: ${l.nextAction}`,
    ]
      .filter(Boolean)
      .join(' / ')
      .slice(0, 240) || l.quickMemo || '（詳細メモなし）',
    score,
    metadata: {
      date: l.visitedAt.slice(0, 10),
      outcome: l.outcome,
      hitProposal: l.hitProposal,
      nextAction: l.nextAction,
    },
  }));
}

function reviewsToChunks(reviews: StoreReview[], storeId: string | undefined, limit: number): RagChunk[] {
  const filtered = storeId
    ? reviews.filter((r) => r.storeId === storeId)
    : reviews;
  return filtered.slice(0, limit).map((r) => {
    const dimParts = Object.entries(r.dimensions)
      .filter(([, v]) => v != null)
      .map(([k, v]) => `${REVIEW_DIMENSION_LABELS[k as keyof typeof REVIEW_DIMENSION_LABELS]}${v}`)
      .join(' ');
    return {
      id: r.id,
      sourceType: 'review' as const,
      title: `口コミ ★${r.rating} · デリバリー向き${r.deliveryFit}`,
      excerpt: `${r.summary} ${dimParts}`.trim().slice(0, 240),
      score: 0.85,
      metadata: {
        rating: String(r.rating),
        deliveryFit: r.deliveryFit,
        dimensionSummary: r.summary,
      },
    };
  });
}

/** 登録済みアプリデータ + セグメントベンチマークから RAG 検索 */
export function retrieveRagContextLocal(data: AppData, query: RagRetrievalQuery): RagContext {
  const limit = query.limitPerSource ?? DEFAULT_LIMIT;
  const { input, storeId } = query;
  const queryTerms = buildQueryTerms(input);
  const segment = inferBenchmarkSegment(input);
  const segKey = `${input.area}|${input.businessType}|${segment}`;
  const hasSegment = !!SEGMENT_BENCHMARKS[segKey];
  const hasExact = !!BENCHMARKS[`${input.area}|${input.businessType}`];

  const benchmarkChunks = [chunkFromBenchmark(input, hasSegment ? 1 : hasExact ? 0.9 : 0.7)];

  const knowledgePool = [
    ...data.knowledgeItems,
    ...ALL_KNOWLEDGE_SEED.map((s) => ({ ...s, createdAt: '', updatedAt: '' })),
  ];
  const uniqueKnowledge = Array.from(new Map(knowledgePool.map((k) => [k.id, k])).values());

  const knowledge = knowledgeToChunks(
    uniqueKnowledge.filter((k) => k.category !== '切り返し' && k.category !== '成功事例'),
    queryTerms,
    limit,
  );

  const salesLogs = salesLogsToChunks(data.salesLogs ?? [], storeId, queryTerms, limit);

  const heardObjections = (data.salesLogs ?? [])
    .filter((l) => !storeId || l.storeId === storeId)
    .map((l) => l.objectionHeard)
    .filter(Boolean);

  const { refs: objectionRefs } = matchObjectionsWithSuccessCases(
    queryTerms,
    uniqueKnowledge,
    heardObjections,
    limit,
  );

  const objections: RagChunk[] = objectionRefs.map((o) => ({
    id: o.id,
    sourceType: 'objection',
    title: o.objection,
    excerpt: [
      o.rebuttalExcerpt,
      o.suggestions?.length ? `→ ${o.suggestions.join(' / ')}` : '',
      o.successCaseTitle ? `（事例: ${o.successCaseTitle}）` : '',
    ]
      .filter(Boolean)
      .join(' '),
    score: o.relevance / 100,
    metadata: {
      suggestions: (o.suggestions ?? []).join('|'),
      successCase: o.successCaseTitle ?? '',
    },
  }));

  const reviews = reviewsToChunks(data.storeReviews ?? [], storeId, limit);

  const chunks = [...benchmarkChunks, ...knowledge, ...salesLogs, ...objections, ...reviews].sort(
    (a, b) => b.score - a.score,
  );

  return {
    chunks,
    benchmarks: benchmarkChunks,
    knowledge,
    salesLogs,
    objections,
    reviews,
    queryTerms,
    retrievedAt: new Date().toISOString(),
  };
}
