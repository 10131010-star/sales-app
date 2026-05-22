import type { AppData } from '@/data/types';
import { formatBenchmarkCondition } from '@/data/analysis/benchmarks';
import { inferPriceBand } from '@/data/analysis/priceBand';
import { inferBenchmarkSegment } from '@/data/analysis/segment';
import type { StoreAnalysisInput, StoreAnalysisResult } from '@/data/analysis/types';
import { normalizeReviewDimensions, REVIEW_DIMENSION_LABELS } from '@/data/reviews/types';
import type { ReviewDimensionKey, StoreReview } from '@/data/reviews/types';
import type { GoogleMapsInfo } from '@/data/googleMaps/types';
import { emptyGoogleMapsInfo, GOOGLE_MAPS_STATUS_LABELS, hasGoogleMapsData } from '@/data/googleMaps/types';
import type {
  RagContext,
  RagEvidence,
  RagGoogleMapsRef,
  RagReviewInsight,
  RagTrustMetrics,
  StoreAnalysisWithRag,
} from '@/data/rag/types';
import { applyGoogleMapsToResult, mergeInputWithGoogleMaps } from '@/lib/googleMaps/analysisImpact';
import { buildGoogleMapsContrastSummary, buildGoogleMapsProposals } from '@/lib/googleMaps/narrative';
import { loadGoogleMapsInfo } from '@/lib/googleMaps/storage';
import { runStoreAnalysis } from '@/lib/analysis/engine';
import { buildOwnerNarrativeFromSales, buildSalesHistoryProposals } from '@/lib/analysis/salesNarrative';
import { retrieveRagContext } from '@/lib/rag';
import { buildReviewBasedProposals, buildReviewContrastSummary } from '@/lib/reviews/narrative';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { getSupabase } from '@/lib/supabase/client';

const METRIC_LABELS = ['単価', '商品数', 'セット率', '深夜営業', 'レビュー'];

function calcMatchRate(matchLevel: StoreAnalysisResult['matchLevel'], confidencePercent: number): number {
  const base =
    matchLevel === 'segment'
      ? 92
      : matchLevel === 'exact'
        ? 85
        : matchLevel === 'business'
          ? 68
          : 45;
  return Math.min(98, Math.round(base + confidencePercent * 0.08));
}

function buildTrustMetrics(base: StoreAnalysisResult, ctx: RagContext): RagTrustMetrics {
  const segment = inferBenchmarkSegment(base.input);
  const priceBand = inferPriceBand(base.input);
  const conditions =
    base.benchmarkCondition ??
    formatBenchmarkCondition(base.input.area, base.input.businessType, segment, priceBand);
  const benchDate = base.benchmark.updatedAt;
  const logDates = ctx.salesLogs.map((s) => s.metadata.date).filter(Boolean);
  const latestLog = logDates.sort().reverse()[0];
  const freshnessDate = latestLog && latestLog > benchDate ? latestLog : benchDate;
  const daysAgo = Math.floor(
    (Date.now() - new Date(freshnessDate).getTime()) / (1000 * 60 * 60 * 24),
  );
  const freshnessLabel =
    daysAgo <= 30 ? '30日以内' : daysAgo <= 90 ? '90日以内' : daysAgo <= 180 ? '180日以内' : '要更新';

  return {
    referenceStoreCount: base.benchmark.sampleSize,
    comparisonConditions: conditions,
    matchRatePercent: calcMatchRate(base.matchLevel, base.confidencePercent),
    dataFreshnessLabel: freshnessLabel,
    dataFreshnessDate: freshnessDate,
  };
}

function aggregateStoreReviews(data: AppData, storeId?: string): StoreReview[] {
  return (data.storeReviews ?? [])
    .filter((r) => !storeId || r.storeId === storeId)
    .map((r) => ({ ...r, dimensions: normalizeReviewDimensions(r.dimensions) }));
}

function buildReviewInsight(reviews: StoreReview[]): RagReviewInsight | undefined {
  if (reviews.length === 0) return undefined;
  const r = reviews[0];
  const dimensionRows = (Object.keys(REVIEW_DIMENSION_LABELS) as ReviewDimensionKey[]).map((k) => {
    const v = r.dimensions[k];
    return {
      label: REVIEW_DIMENSION_LABELS[k],
      score: v,
      tone: (v == null ? 'neutral' : v >= 4 ? 'positive' : v <= 2.5 ? 'negative' : 'neutral') as
        | 'positive'
        | 'negative'
        | 'neutral',
    };
  });

  const dimensionHighlights = dimensionRows
    .filter((d) => d.score != null && d.score >= 3.5)
    .map((d) => ({ label: d.label, score: d.score as number }));

  return {
    deliveryFitLabel: r.deliveryFit,
    deliveryFitNote: r.deliveryFitNote,
    contrastSummary: buildReviewContrastSummary(r),
    dimensionHighlights,
    dimensionRows,
    proposalSentences: buildReviewBasedProposals(r),
  };
}

function buildGoogleMapsRef(maps: GoogleMapsInfo): RagGoogleMapsRef {
  const refReviews = [maps.latestReviews, maps.positiveTrend, maps.negativeTrend]
    .filter((s) => s.trim().length > 0)
    .join(' / ')
    .slice(0, 300);

  return {
    mapsUrl: maps.mapsUrl || '—',
    placeName: maps.placeName || '—',
    rating: maps.rating != null ? String(maps.rating) : '未確認',
    reviewCount: maps.reviewCount != null ? String(maps.reviewCount) : '未確認',
    hours: maps.hours || '未確認',
    genre: maps.genre || '未確認',
    referencedReviews: refReviews || '（未入力）',
    positiveTrend: maps.positiveTrend || '—',
    negativeTrend: maps.negativeTrend || '—',
    dataStatus: maps.dataStatus,
    dataStatusLabel: GOOGLE_MAPS_STATUS_LABELS[maps.dataStatus],
  };
}

function buildRagEvidence(
  ctx: RagContext,
  base: StoreAnalysisResult,
  data: AppData,
  googleMaps: GoogleMapsInfo,
): RagEvidence {
  const confidenceChecked = Object.values(base.input.confidence).filter(Boolean).length;
  const trustMetrics = buildTrustMetrics(base, ctx);
  const storeReviews = aggregateStoreReviews(data, base.input.linkedStoreId);
  const reviewInsight = buildReviewInsight(storeReviews);
  const googleMapsProposals = buildGoogleMapsProposals(googleMaps);

  return {
    benchmarkRef: {
      label: base.benchmarkLabel,
      sampleSize: base.benchmark.sampleSize,
      sourceNote: base.benchmark.dataSourceNote,
      matchLevel: base.matchLevel,
    },
    comparedMetricLabels: METRIC_LABELS,
    knowledgeRefs: ctx.knowledge.map((k) => ({
      id: k.id,
      category: k.metadata.category ?? '',
      title: k.title,
      excerpt: k.excerpt,
      relevance: Math.round(k.score * 100),
    })),
    salesLogRefs: ctx.salesLogs.map((s) => ({
      id: s.id,
      date: s.metadata.date ?? s.title,
      excerpt: s.excerpt,
      relevance: Math.round(s.score * 100),
      outcome: s.metadata.outcome,
      hitProposal: s.metadata.hitProposal,
      nextAction: s.metadata.nextAction,
    })),
    objectionRefs: ctx.objections.map((o) => {
      const suggestions = o.metadata.suggestions?.split('|').filter(Boolean) ?? [];
      return {
        id: o.id,
        objection: o.title,
        rebuttalExcerpt: o.excerpt,
        relevance: Math.round(o.score * 100),
        suggestions,
        successCaseTitle: o.metadata.successCase || undefined,
      };
    }),
    reviewRefs: ctx.reviews.map((r) => ({
      id: r.id,
      rating: r.metadata.rating,
      excerpt: r.excerpt,
      relevance: Math.round(r.score * 100),
      deliveryFit: r.metadata.deliveryFit,
      dimensionSummary: r.metadata.dimensionSummary,
    })),
    retrievalSummary: `検索語: ${ctx.queryTerms.slice(0, 8).join(', ')}… ／ 取得 ${ctx.chunks.length}件`,
    totalChunksRetrieved: ctx.chunks.length,
    dataConfidenceNote: `データ信頼度 ${base.confidencePercent}%（確認済み ${confidenceChecked}/5 項目）。一致率（参考）${trustMetrics.matchRatePercent}%。`,
    trustMetrics,
    reviewInsight,
    googleMapsRef: buildGoogleMapsRef(googleMaps),
    googleMapsProposals,
  };
}

function enrichWithRag(
  base: StoreAnalysisResult,
  ctx: RagContext,
  evidence: RagEvidence,
  data: AppData,
  googleMaps: GoogleMapsInfo,
): Partial<StoreAnalysisWithRag> {
  const strengths = [...base.strengths];
  const concerns = [...base.concerns];
  const recommendations = [...base.recommendations];
  const reasons = [...base.analysisReasons];

  const storeId = base.input.linkedStoreId;
  const storeLogs = (data.salesLogs ?? [])
    .filter((l) => !storeId || l.storeId === storeId)
    .sort((a, b) => b.visitedAt.localeCompare(a.visitedAt));

  if (evidence.reviewInsight) {
    for (const p of evidence.reviewInsight.proposalSentences) {
      recommendations.unshift(p);
    }
    strengths.push(evidence.reviewInsight.contrastSummary);
  }

  if (evidence.googleMapsProposals.length > 0) {
    for (const p of evidence.googleMapsProposals) {
      recommendations.unshift(p);
    }
    if (hasGoogleMapsData(googleMaps)) {
      strengths.push(buildGoogleMapsContrastSummary(googleMaps));
    }
  } else if (evidence.googleMapsRef.dataStatus === 'unconfirmed') {
    concerns.push(
      'Google Maps情報は未確認です。手入力があると、口コミ・評価を根拠にした提案精度が上がる可能性があります。',
    );
  }

  const salesProposals = buildSalesHistoryProposals(storeLogs);
  for (const p of salesProposals) {
    recommendations.push(p);
  }

  if (ctx.knowledge.length > 0) {
    const k = ctx.knowledge[0];
    recommendations.push(
      `上位店傾向に加え、社内ナレッジ「${k.title}」とも整合する可能性があります（${k.excerpt.slice(0, 60)}…）。`,
    );
  }

  for (const obj of evidence.objectionRefs.slice(0, 2)) {
    if (obj.suggestions && obj.suggestions.length > 0) {
      recommendations.push(
        `断り文句「${obj.objection.slice(0, 24)}」に対し、成功事例から見ると次の打ち手が参考になる可能性があります：${obj.suggestions.join('、')}。`,
      );
    }
  }

  reasons.push(
    `比較条件: ${evidence.trustMetrics.comparisonConditions}（参照${evidence.trustMetrics.referenceStoreCount}店・一致率参考${evidence.trustMetrics.matchRatePercent}%・鮮度${evidence.trustMetrics.dataFreshnessLabel}）。`,
  );
  reasons.push('外部生成AIは使用せず、登録データの検索とルールベース比較で合成しています。');

  const salesNarrative = buildOwnerNarrativeFromSales(storeLogs, base.input.name);
  const ownerExtra = [
    salesNarrative,
    evidence.reviewInsight?.contrastSummary,
    `【比較条件】${evidence.trustMetrics.comparisonConditions}`,
  ]
    .filter(Boolean)
    .join('\n\n');

  const reviewBasedProposals = evidence.reviewInsight?.proposalSentences ?? [];
  const googleMapsProposals = evidence.googleMapsProposals;

  const ownerGmaps =
    hasGoogleMapsData(googleMaps) ? `\n\n${buildGoogleMapsContrastSummary(googleMaps)}` : '';

  return {
    strengths: strengths.slice(0, 7),
    concerns: concerns.slice(0, 7),
    recommendations: [...new Set(recommendations)].slice(0, 12),
    analysisReasons: reasons,
    ownerNarrative: `${base.ownerNarrative}\n\n${ownerExtra}${ownerGmaps}`.trim(),
    overallSummary: `${base.overallSummary} 根拠データ${evidence.totalChunksRetrieved}件を参照。`,
    reviewBasedProposals,
    googleMapsProposals,
  };
}

async function persistReport(
  base: StoreAnalysisResult,
  ragEvidence: RagEvidence,
  storeId?: string,
): Promise<void> {
  const payload = {
    store_id: storeId ?? null,
    store_name: base.input.name,
    area: base.input.area,
    business_type: base.input.businessType,
    overall_score: base.overallScore,
    adoption_potential: base.adoptionPotential,
    input_json: base.input,
    result_json: base,
    rag_evidence_json: ragEvidence,
  };

  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabase();
      await sb.from('reports').insert(payload);
      return;
    } catch {
      /* local fallback */
    }
  }

  try {
    const key = 'sales-app:rag-reports';
    const existing = JSON.parse(localStorage.getItem(key) ?? '[]') as unknown[];
    existing.unshift({ ...payload, id: crypto.randomUUID(), created_at: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(existing.slice(0, 50)));
  } catch {
    /* ignore */
  }
}

export async function runStoreAnalysisWithRag(
  data: AppData,
  input: StoreAnalysisInput,
): Promise<StoreAnalysisWithRag> {
  const storeId = input.linkedStoreId;
  const googleMaps = storeId ? loadGoogleMapsInfo(storeId) : emptyGoogleMapsInfo('');
  const mergedInput = mergeInputWithGoogleMaps(input, googleMaps);

  let base = runStoreAnalysis(mergedInput);
  const mapsImpact = applyGoogleMapsToResult(base, googleMaps);
  base = { ...base, ...mapsImpact };

  const rag = await retrieveRagContext(data, {
    input: mergedInput,
    storeId,
  });
  const ragEvidence = buildRagEvidence(rag, base, data, googleMaps);
  const enriched = enrichWithRag(base, rag, ragEvidence, data, googleMaps);

  const result: StoreAnalysisWithRag = {
    ...base,
    ...enriched,
    rag,
    ragEvidence,
  };

  await persistReport(result, ragEvidence, input.linkedStoreId);
  return result;
}
