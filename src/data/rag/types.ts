import type { StoreAnalysisInput, StoreAnalysisResult } from '@/data/analysis/types';

export type RagSourceType =
  | 'benchmark'
  | 'knowledge'
  | 'sales_log'
  | 'objection'
  | 'review'
  | 'competitor';

export interface RagChunk {
  id: string;
  sourceType: RagSourceType;
  title: string;
  excerpt: string;
  /** 0–1 関連度 */
  score: number;
  metadata: Record<string, string>;
}

export interface RagRetrievalQuery {
  input: StoreAnalysisInput;
  storeId?: string;
  /** 各カテゴリの最大取得件数 */
  limitPerSource?: number;
}

export interface RagContext {
  chunks: RagChunk[];
  benchmarks: RagChunk[];
  knowledge: RagChunk[];
  salesLogs: RagChunk[];
  objections: RagChunk[];
  reviews: RagChunk[];
  queryTerms: string[];
  retrievedAt: string;
}

export interface RagKnowledgeRef {
  id: string;
  category: string;
  title: string;
  excerpt: string;
  relevance: number;
}

export interface RagSalesLogRef {
  id: string;
  date: string;
  excerpt: string;
  relevance: number;
  outcome?: string;
  hitProposal?: string;
  nextAction?: string;
}

export interface RagObjectionRef {
  id: string;
  objection: string;
  rebuttalExcerpt: string;
  relevance: number;
  /** 成功事例ベースの改善提案（例: 昼帯のみ導入） */
  suggestions?: string[];
  successCaseTitle?: string;
}

export interface RagReviewRef {
  id: string;
  rating?: string;
  excerpt: string;
  relevance: number;
  deliveryFit?: string;
  dimensionSummary?: string;
}

export interface RagReviewDimensionRow {
  label: string;
  score: number | null;
  tone: 'positive' | 'negative' | 'neutral';
}

export interface RagReviewInsight {
  deliveryFitLabel: string;
  deliveryFitNote: string;
  contrastSummary: string;
  dimensionHighlights: { label: string; score: number }[];
  dimensionRows: RagReviewDimensionRow[];
  proposalSentences: string[];
}

export interface RagGoogleMapsRef {
  mapsUrl: string;
  placeName: string;
  rating: string;
  reviewCount: string;
  hours: string;
  genre: string;
  referencedReviews: string;
  positiveTrend: string;
  negativeTrend: string;
  dataStatus: string;
  dataStatusLabel: string;
}

export interface RagTrustMetrics {
  referenceStoreCount: number;
  comparisonConditions: string;
  matchRatePercent: number;
  dataFreshnessLabel: string;
  dataFreshnessDate: string;
}

/** レポートに必ず表示する根拠 */
export interface RagEvidence {
  benchmarkRef: {
    label: string;
    sampleSize: number;
    sourceNote: string;
    matchLevel: string;
  };
  comparedMetricLabels: string[];
  knowledgeRefs: RagKnowledgeRef[];
  salesLogRefs: RagSalesLogRef[];
  objectionRefs: RagObjectionRef[];
  reviewRefs: RagReviewRef[];
  retrievalSummary: string;
  totalChunksRetrieved: number;
  dataConfidenceNote: string;
  trustMetrics: RagTrustMetrics;
  reviewInsight?: RagReviewInsight;
  googleMapsRef: RagGoogleMapsRef;
  googleMapsProposals: string[];
}

export interface StoreAnalysisWithRag extends StoreAnalysisResult {
  rag: RagContext;
  ragEvidence: RagEvidence;
}
