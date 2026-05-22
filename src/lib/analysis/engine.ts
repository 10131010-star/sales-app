import { formatBenchmarkCondition, resolveBenchmarkFromInput } from '@/data/analysis/benchmarks';
import { inferBenchmarkSegment } from '@/data/analysis/segment';
import { BENCHMARK_SEGMENT_LABELS } from '@/data/analysis/types';
import { PRICE_BAND_LABELS } from '@/data/analysis/priceBand';
import type {
  AdoptionPotential,
  BenchmarkProfile,
  CategoryScore,
  DataConfidenceChecks,
  ManagerReport,
  MetricComparison,
  MetricKey,
  StoreAnalysisInput,
  StoreAnalysisResult,
} from '@/data/analysis/types';

const SIMILAR_THRESHOLD = 12; // % difference treated as "similar"

function diffPercent(store: number, bench: number): number {
  if (bench === 0) return 0;
  return Math.round(((store - bench) / bench) * 100);
}

function position(diff: number): 'above' | 'similar' | 'below' {
  if (diff >= SIMILAR_THRESHOLD) return 'above';
  if (diff <= -SIMILAR_THRESHOLD) return 'below';
  return 'similar';
}

function calcConfidence(c: DataConfidenceChecks): { percent: number; label: string } {
  const keys = Object.keys(c) as (keyof DataConfidenceChecks)[];
  const checked = keys.filter((k) => c[k]).length;
  const percent = Math.round((checked / keys.length) * 100);
  const label =
    percent >= 80 ? '高' : percent >= 50 ? '中' : '低';
  return { percent, label };
}

interface MetricDef {
  key: MetricKey;
  label: string;
  unit: string;
  getStore: (i: StoreAnalysisInput) => number;
  getBench: (b: BenchmarkProfile) => number;
  higherIsBetter: boolean;
}

const METRICS: MetricDef[] = [
  { key: 'avgUnitPrice', label: '平均単価', unit: '円', getStore: (i) => i.avgUnitPrice, getBench: (b) => b.avgUnitPrice, higherIsBetter: true },
  { key: 'productCount', label: '商品数', unit: '品', getStore: (i) => i.productCount, getBench: (b) => b.avgProductCount, higherIsBetter: false },
  { key: 'setRate', label: 'セット率', unit: '%', getStore: (i) => i.setRate, getBench: (b) => b.avgSetRate, higherIsBetter: true },
  { key: 'lateNightRate', label: '深夜営業率', unit: '%', getStore: (i) => i.lateNightRate, getBench: (b) => b.avgLateNightRate, higherIsBetter: true },
  { key: 'reviewScore', label: 'レビュー平均', unit: '点', getStore: (i) => i.reviewScore, getBench: (b) => b.avgReviewScore, higherIsBetter: true },
];

function analyzeMetric(
  def: MetricDef,
  input: StoreAnalysisInput,
  bench: BenchmarkProfile,
): MetricComparison {
  const storeValue = def.getStore(input);
  const benchmarkValue = def.getBench(bench);
  const diff = diffPercent(storeValue, benchmarkValue);
  const pos = position(diff);

  let analysis = '';
  const prefix = '上位店傾向から見ると、';

  switch (def.key) {
    case 'avgUnitPrice':
      if (pos === 'above') analysis = `${prefix}単価は上位店平均より高めです。利益設計次第ではデリバリーでも単価を維持しやすい傾向があります。`;
      else if (pos === 'below') analysis = `${prefix}単価は上位店より低めです。セット設計やトッピングで客単価を上げる余地がある可能性があります。`;
      else analysis = `${prefix}単価は上位店平均と同程度です。`;
      break;
    case 'productCount':
      if (pos === 'above') analysis = `${prefix}商品数は上位店より多めです。掲載を絞った方がオペレーション負担を抑えやすいケースがあります。`;
      else if (pos === 'below') analysis = `${prefix}商品数は上位店より少なめです。人気商品に集中する運用と相性が良い可能性があります。`;
      else analysis = `${prefix}商品数は上位店平均と同程度です。`;
      break;
    case 'setRate':
      if (pos === 'above') analysis = `${prefix}セット率は上位店水準以上です。デリバリーでもセット販売の流れを活かしやすい傾向があります。`;
      else if (pos === 'below') analysis = `${prefix}セット率は上位店より低めです。ドリンク・サイドとのセット化で注文単価を上げる余地がある可能性があります。`;
      else analysis = `${prefix}セット率は上位店平均と同程度です。`;
      break;
    case 'lateNightRate':
      if (pos === 'above') analysis = `${prefix}深夜帯の需要取り込みは上位店に近い水準です。夜帯のデリバリー需要と相性を確認する価値があります。`;
      else if (pos === 'below') analysis = `${prefix}深夜営業率は上位店より低めです。昼・夕方など稼働しやすい時間帯から始める設計が現実的な可能性があります。`;
      else analysis = `${prefix}深夜帯の傾向は上位店平均と同程度です。`;
      break;
    case 'reviewScore':
      if (pos === 'above') analysis = `${prefix}レビュー評価は上位店平均以上です。品質面の訴求材料になりやすい傾向があります。`;
      else if (pos === 'below') analysis = `${prefix}レビューは上位店より低めです。配送向き商品の選定と写真品質の見直しが有効な可能性があります。`;
      else analysis = `${prefix}レビュー評価は上位店平均と同程度です。`;
      break;
  }

  return {
    key: def.key,
    label: def.label,
    unit: def.unit,
    storeValue,
    benchmarkValue,
    diffPercent: diff,
    position: pos,
    analysis,
  };
}

function buildStrengths(metrics: MetricComparison[], input: StoreAnalysisInput): string[] {
  const list: string[] = [];
  for (const m of metrics) {
    const good =
      (m.key === 'productCount' && m.position === 'below') ||
      (m.key !== 'productCount' && m.position === 'above');
    if (good) {
      list.push(`${m.label}：${m.analysis.replace('上位店傾向から見ると、', '')}`);
    }
  }
  if (input.reviewScore >= 4.0 && !list.some((s) => s.includes('レビュー'))) {
    list.push('レビュー評価が4.0以上で、品質面の信頼材料になりやすい傾向があります。');
  }
  if (list.length === 0) {
    list.push('上位店平均と大きく乖離しないバランス型です。小さく始めるテスト導入と相性を確認する価値があります。');
  }
  return list.slice(0, 4);
}

function buildConcerns(metrics: MetricComparison[]): string[] {
  const list: string[] = [];
  for (const m of metrics) {
    const bad =
      (m.key === 'productCount' && m.position === 'above') ||
      (m.key !== 'productCount' && m.position === 'below');
    if (bad) {
      list.push(`${m.label}：${m.analysis.replace('上位店傾向から見ると、', '')}`);
    }
  }
  if (list.length === 0) {
    list.push('上位店平均と比べて致命的な乖離は見られません。ただし現地・口コミの再確認は推奨します。');
  }
  return list.slice(0, 4);
}

function buildRecommendations(
  metrics: MetricComparison[],
  bench: BenchmarkProfile,
): string[] {
  const rec: string[] = [];
  const setM = metrics.find((m) => m.key === 'setRate');
  const prodM = metrics.find((m) => m.key === 'productCount');
  const lateM = metrics.find((m) => m.key === 'lateNightRate');
  const priceM = metrics.find((m) => m.key === 'avgUnitPrice');

  if (setM?.position === 'below') {
    rec.push('上位店傾向から見ると、セットメニュー設計の強化が検討候補です（例：メイン＋ドリンク＋サイド）。');
  }
  if (prodM?.position === 'above') {
    rec.push(`掲載は人気${Math.min(8, Math.max(5, Math.round(bench.avgProductCount * 0.6)))}品程度に絞る運用が、上位店の傾向に近い可能性があります。`);
  }
  if (lateM?.position === 'below') {
    rec.push('深夜帯より、ランチ・夕方など負荷の少ない時間帯からのテスト稼働が現実的な可能性があります。');
  }
  if (priceM?.position === 'below') {
    rec.push('単価を維持するため、安売りせずセット・トッピングで客単価を設計する方法が上位店で見られる傾向です。');
  }
  rec.push('いきなり全メニュー掲載ではなく、利益が残りやすい商品から小さく始める導入が、上位店の運用パターンと整合しやすいです。');
  return [...new Set(rec)].slice(0, 5);
}

function metricScore(m: MetricComparison, higherIsBetter: boolean): number {
  if (m.position === 'similar') return 72;
  const good = higherIsBetter ? m.position === 'above' : m.position === 'below';
  if (good) return Math.min(95, 78 + Math.abs(m.diffPercent) * 0.3);
  return Math.max(35, 68 - Math.abs(m.diffPercent) * 0.4);
}

function buildCategoryScores(metrics: MetricComparison[]): CategoryScore[] {
  const by = (k: MetricKey) => metrics.find((m) => m.key === k)!;
  const price = by('avgUnitPrice');
  const prod = by('productCount');
  const set = by('setRate');
  const late = by('lateNightRate');
  const review = by('reviewScore');

  const sellability = Math.round(
    metricScore(set, true) * 0.35 +
      metricScore(review, true) * 0.35 +
      metricScore(late, true) * 0.3,
  );
  const profitability = Math.round(
    metricScore(price, true) * 0.45 +
      metricScore(set, true) * 0.35 +
      metricScore(prod, false) * 0.2,
  );
  const operability = Math.round(
    metricScore(prod, false) * 0.5 +
      metricScore(late, false) * 0.25 +
      (prod.position !== 'above' ? 75 : 55) * 0.25,
  );

  return [
    {
      key: 'sellability',
      label: '売れやすさ',
      score: sellability,
      summary: '上位店のセット率・レビュー・深夜需要との整合',
      basis: `セット率${set.position === 'above' ? '◎' : set.position === 'below' ? '△' : '○'}、レビュー${review.position === 'above' ? '◎' : review.position === 'below' ? '△' : '○'}、深夜帯${late.position === 'above' ? '◎' : late.position === 'below' ? '△' : '○'}（いずれも上位店平均との比較）`,
    },
    {
      key: 'profitability',
      label: '利益残りやすさ',
      score: profitability,
      summary: '単価・セット設計・商品数のバランス',
      basis: `平均単価${price.position === 'above' ? '◎' : price.position === 'below' ? '△' : '○'}、セット率${set.position === 'above' ? '◎' : '△'}、商品数${prod.position === 'below' ? '◎（絞りやすい）' : prod.position === 'above' ? '△（多め）' : '○'}`,
    },
    {
      key: 'operability',
      label: '運用しやすさ',
      score: operability,
      summary: '掲載商品数と時間帯設計の負荷',
      basis: `商品数${prod.position === 'below' ? '◎（上位より少なく運用しやすい）' : prod.position === 'above' ? '△（多く負荷増の可能性）' : '○'}、深夜稼働${late.position === 'below' ? '◎（昼夕中心で始めやすい）' : '○'}`,
    },
  ];
}

function calcOverallScore(
  categoryScores: CategoryScore[],
  confidencePercent: number,
  adoption: AdoptionPotential,
): number {
  const avg = categoryScores.reduce((s, c) => s + c.score, 0) / categoryScores.length;
  const confBonus = (confidencePercent - 50) * 0.15;
  const adoptBonus = adoption === '高' ? 5 : adoption === '低' ? -5 : 0;
  return Math.round(Math.min(100, Math.max(0, avg + confBonus + adoptBonus)));
}

function buildOwnerNarrative(
  input: StoreAnalysisInput,
  bench: BenchmarkProfile,
  metrics: MetricComparison[],
): string {
  const late = metrics.find((m) => m.key === 'lateNightRate');
  const set = metrics.find((m) => m.key === 'setRate');
  const parts: string[] = [];

  parts.push(
    `${input.area}エリアでは、${input.businessType}は上位${bench.sampleSize}店舗の平均と比較して分析しています。`,
  );

  if (bench.avgLateNightRate >= 50) {
    parts.push(
      `上位店傾向から見ると、このエリア・業態では深夜帯の需要が比較的強く（上位平均の深夜営業率${bench.avgLateNightRate}%前後）、夜帯のデリバリー導線と相性を確認する価値がある可能性があります。`,
    );
  } else if (late?.position === 'below') {
    parts.push(
      `上位店傾向から見ると、深夜帯より昼・夕方の時間帯から小さく始める設計が、オペレーション負荷を抑えやすい傾向です。`,
    );
  }

  if (set && bench.avgSetRate >= 50) {
    parts.push(
      `セット商品比率が高い店舗ほど客単価が上がりやすい傾向があり（上位平均セット率${bench.avgSetRate}%）、御社のセット率${input.setRate}%との差が改善ポイントになる可能性があります。`,
    );
  }

  parts.push(
    `本分析は「必ず売れる」という断定ではなく、同条件の上位店舗データとの比較に基づく参考情報です。`,
  );

  return parts.join('\n\n');
}

function buildAnalysisReasons(
  matchLabel: string,
  bench: BenchmarkProfile,
  matchLevel: 'exact' | 'segment' | 'business' | 'global',
): string[] {
  return [
    `比較対象: ${matchLabel}（参照店舗数: 約${bench.sampleSize}店）`,
    `データ源: ${bench.dataSourceNote}（最終更新: ${bench.updatedAt}）`,
    matchLevel === 'segment'
      ? 'エリア×業態×店舗タイプ（深夜営業/ランチ等）のセグメントベンチマークを使用。比較精度は最も高い想定です。'
      : matchLevel === 'exact'
      ? '同一エリア・同一業態の専用ベンチマークを使用したため、比較精度は高めです。'
      : matchLevel === 'business'
        ? 'エリア専用データがないため業態平均で比較しています。可能であればエリア別ベンチマークの追加調査を推奨します。'
        : '広域参考値のため、エリア・業態の専用調査があると精度が上がります。',
    '各数値は±12%以内を「上位店と同程度」、それ以外を上回る/下回ると判定しています。',
    '強み・懸念・改善提案は、上記の数値比較ルールから自動生成しています（外部AIの推測ではありません）。',
  ];
}

function scoreAdoption(metrics: MetricComparison[], confidencePercent: number): AdoptionPotential {
  let score = 50;
  for (const m of metrics) {
    if (m.key === 'setRate' && m.position === 'above') score += 8;
    if (m.key === 'reviewScore' && m.position === 'above') score += 8;
    if (m.key === 'avgUnitPrice' && m.position === 'above') score += 5;
    if (m.key === 'lateNightRate' && m.position === 'above') score += 5;
    if (m.key === 'productCount' && m.position === 'above') score -= 6;
    if (m.key === 'reviewScore' && m.position === 'below') score -= 8;
    if (m.key === 'setRate' && m.position === 'below') score -= 5;
  }
  score += Math.round((confidencePercent - 50) * 0.2);
  if (score >= 65) return '高';
  if (score >= 45) return '中';
  return '低';
}

function buildManagerReport(
  storeName: string,
  bench: BenchmarkProfile,
  metrics: MetricComparison[],
  adoption: AdoptionPotential,
  confidencePercent: number,
  matchLabel: string,
): ManagerReport {
  const adoptionText =
    adoption === '高'
      ? '上位店傾向との整合性が比較的高く、条件を整えればデリバリー導入の検討余地がある可能性があります。'
      : adoption === '中'
        ? '一部に上位店との差がありますが、商品設計・運用を調整すれば検討余地がある可能性があります。'
        : '上位店平均との差が大きい項目があります。現状のままの導入は慎重な検討が望ましい可能性があります。';

  const cautions = buildConcerns(metrics).map((c) => c.split('：').pop() ?? c);

  const approach: string[] = [
    'まずは人気商品5品程度・稼働時間帯を限定したテスト導入',
    'セット・単価設計を上位店水準に近づけてから掲載拡大',
    '写真・商品名はデリバリー専用に最適化（店内メニューのそのまま掲載は避ける）',
  ];

  return {
    overallRating:
      adoption === '高' ? 'B+（導入検討余地あり）' : adoption === '中' ? 'B（条件付きで検討可）' : 'C（要改善後に検討）',
    adoptionHeadline: `導入余地：${adoption}`,
    adoptionBody: adoptionText,
    cautions: cautions.slice(0, 3),
    recommendedApproach: approach,
    disclaimer: `「${storeName}」について、${matchLabel}（参照${bench.sampleSize}店舗）との比較に基づく参考情報です。「必ず売れる」といった断定は含みません。データ信頼度${confidencePercent}%（現地確認等のチェック状況に依存）。最終判断は貴店の運用状況にてお願いします。`,
  };
}

export function runStoreAnalysis(input: StoreAnalysisInput): StoreAnalysisResult {
  const segment = inferBenchmarkSegment(input);
  const { profile, matchLevel, segmentUsed, priceBand } = resolveBenchmarkFromInput(input, segment);
  const metrics = METRICS.map((d) => analyzeMetric(d, input, profile));
  const { percent, label } = calcConfidence(input.confidence);

  const condition = formatBenchmarkCondition(input.area, input.businessType, segmentUsed, priceBand);
  const matchLabel =
    matchLevel === 'segment'
      ? `${condition}の上位店${profile.sampleSize}店平均（セグメント一致）`
      : matchLevel === 'exact'
        ? `${condition}の上位店${profile.sampleSize}店平均`
        : matchLevel === 'business'
          ? `${input.businessType}の業態平均（${input.area}の専用ベンチマークなし）`
          : '大阪飲食店の広域参考値';

  const adoption = scoreAdoption(metrics, percent);
  const categoryScores = buildCategoryScores(metrics);
  const overallScore = calcOverallScore(categoryScores, percent, adoption);
  const strengths = buildStrengths(metrics, input);
  const concerns = buildConcerns(metrics);
  const recommendations = buildRecommendations(metrics, profile);
  const report = buildManagerReport(input.name, profile, metrics, adoption, percent, matchLabel);
  const ownerNarrative = buildOwnerNarrative(input, profile, metrics);
  const analysisReasons = buildAnalysisReasons(matchLabel, profile, matchLevel);

  const overallSummary = `「${input.name}」を${matchLabel}と比較しました。総合分析スコア${overallScore}点。上位店傾向から見ると、導入余地は【${adoption}】の参考値です（データ信頼度：${label}／${percent}%）。`;

  return {
    input,
    benchmark: profile,
    benchmarkLabel: matchLabel,
    matchLevel,
    benchmarkSegment: segmentUsed,
    benchmarkSegmentLabel: BENCHMARK_SEGMENT_LABELS[segmentUsed],
    benchmarkPriceBand: PRICE_BAND_LABELS[priceBand],
    benchmarkCondition: condition,
    metrics,
    overallScore,
    categoryScores,
    strengths,
    concerns,
    recommendations,
    confidencePercent: percent,
    confidenceLabel: label,
    adoptionPotential: adoption,
    overallSummary,
    ownerNarrative,
    analysisReasons,
    report,
    analyzedAt: new Date().toISOString(),
  };
}

/** 店舗カルテから分析入力の初期値を生成 */
export function defaultAnalysisInputFromStore(
  store: { id: string; name: string; area: string; businessType: string },
): StoreAnalysisInput {
  const draftInput: StoreAnalysisInput = {
    name: store.name,
    area: store.area || '難波',
    businessType: store.businessType || '居酒屋',
    avgUnitPrice: 1200,
    productCount: 20,
    setRate: 40,
    lateNightRate: 30,
    reviewScore: 3.8,
    confidence: {
      googleMaps: false,
      uberSearch: false,
      reviewCheck: false,
      photoCheck: false,
      siteVisit: false,
    },
    linkedStoreId: store.id,
  };
  const { profile } = resolveBenchmarkFromInput(draftInput, inferBenchmarkSegment(draftInput));
  return {
    name: store.name,
    area: store.area || '難波',
    businessType: store.businessType || '居酒屋',
    avgUnitPrice: Math.round(profile.avgUnitPrice * 0.92),
    productCount: Math.round(profile.avgProductCount * 1.05),
    setRate: Math.max(0, profile.avgSetRate - 12),
    lateNightRate: Math.max(0, profile.avgLateNightRate - 10),
    reviewScore: Math.max(3, profile.avgReviewScore - 0.2),
    confidence: {
      googleMaps: false,
      uberSearch: false,
      reviewCheck: false,
      photoCheck: false,
      siteVisit: false,
    },
    linkedStoreId: store.id,
  };
}

export function formatMetricValue(key: MetricKey, value: number): string {
  if (key === 'avgUnitPrice') return `¥${value.toLocaleString()}`;
  if (key === 'reviewScore') return value.toFixed(1);
  return String(value);
}
