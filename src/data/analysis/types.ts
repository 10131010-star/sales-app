/** ベンチマークの店舗タイプ（エリア×業態×セグメント） */
export type BenchmarkSegment = 'standard' | 'late_night' | 'lunch';

export const BENCHMARK_SEGMENT_LABELS: Record<BenchmarkSegment, string> = {
  standard: '標準',
  late_night: '深夜営業型',
  lunch: 'ランチ型',
};

/** エリア×業態の上位店ベンチマーク（手動整備・MVP） */
export interface BenchmarkProfile {
  area: string;
  businessType: string;
  /** セグメント（未指定は standard） */
  segment?: BenchmarkSegment;
  segmentLabel?: string;
  /** 参照した上位店舗数（目安） */
  sampleSize: number;
  avgUnitPrice: number;
  avgProductCount: number;
  /** セットメニュー比率 % */
  avgSetRate: number;
  /** 深夜帯（22時以降）営業・注文対応の割合 % */
  avgLateNightRate: number;
  /** レビュー平均（5点満点） */
  avgReviewScore: number;
  dataSourceNote: string;
  updatedAt: string;
}

export interface DataConfidenceChecks {
  googleMaps: boolean;
  uberSearch: boolean;
  reviewCheck: boolean;
  photoCheck: boolean;
  siteVisit: boolean;
}

export interface StoreAnalysisInput {
  name: string;
  area: string;
  businessType: string;
  avgUnitPrice: number;
  productCount: number;
  setRate: number;
  lateNightRate: number;
  reviewScore: number;
  confidence: DataConfidenceChecks;
  /** 既存店舗カルテから読み込んだ場合 */
  linkedStoreId?: string;
}

export type MetricKey =
  | 'avgUnitPrice'
  | 'productCount'
  | 'setRate'
  | 'lateNightRate'
  | 'reviewScore';

export interface MetricComparison {
  key: MetricKey;
  label: string;
  unit: string;
  storeValue: number;
  benchmarkValue: number;
  diffPercent: number;
  position: 'above' | 'similar' | 'below';
  analysis: string;
}

export type AdoptionPotential = '高' | '中' | '低';

export type CategoryScoreKey = 'sellability' | 'profitability' | 'operability';

export interface CategoryScore {
  key: CategoryScoreKey;
  label: string;
  score: number;
  summary: string;
  basis: string;
}

export interface StoreAnalysisResult {
  input: StoreAnalysisInput;
  benchmark: BenchmarkProfile;
  benchmarkLabel: string;
  matchLevel: 'exact' | 'segment' | 'business' | 'global';
  /** 使用したベンチマークセグメント（営業タイプ） */
  benchmarkSegment?: BenchmarkSegment;
  benchmarkSegmentLabel?: string;
  benchmarkPriceBand?: string;
  benchmarkCondition?: string;
  /** 口コミ根拠に基づく提案文 */
  reviewBasedProposals?: string[];
  /** Google Maps根拠に基づく提案文 */
  googleMapsProposals?: string[];
  metrics: MetricComparison[];
  /** 総合分析スコア 0–100 */
  overallScore: number;
  categoryScores: CategoryScore[];
  strengths: string[];
  concerns: string[];
  recommendations: string[];
  confidencePercent: number;
  confidenceLabel: string;
  adoptionPotential: AdoptionPotential;
  overallSummary: string;
  /** 店舗責任者向けの説明文 */
  ownerNarrative: string;
  /** なぜそう分析したか */
  analysisReasons: string[];
  report: ManagerReport;
  analyzedAt: string;
}

export interface ManagerReport {
  overallRating: string;
  adoptionHeadline: string;
  adoptionBody: string;
  cautions: string[];
  recommendedApproach: string[];
  disclaimer: string;
}
