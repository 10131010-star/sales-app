/** 口コミ分析8軸（1–5。未入力は null） */
export type ReviewDimensionKey =
  | 'taste'
  | 'price'
  | 'volume'
  | 'speed'
  | 'service'
  | 'photoGap'
  | 'waitTime'
  | 'deliverySuitability';

export const REVIEW_DIMENSION_LABELS: Record<ReviewDimensionKey, string> = {
  taste: '味',
  price: '価格',
  volume: 'ボリューム',
  speed: '提供速度',
  service: '接客',
  photoGap: '写真との差',
  waitTime: '待ち時間',
  deliverySuitability: 'デリバリー適性',
};

export const REVIEW_DIMENSION_KEYS: ReviewDimensionKey[] = [
  'taste',
  'price',
  'volume',
  'speed',
  'service',
  'photoGap',
  'waitTime',
  'deliverySuitability',
];

export type ReviewDimensionScores = Record<ReviewDimensionKey, number | null>;

export type DeliveryFitLevel = '高い可能性' | 'やや高い' | '要確認' | 'やや低い' | '低い可能性';

export interface StoreReview {
  id: string;
  storeId: string | null;
  storeName: string;
  area: string;
  businessType: string;
  rating: number;
  reviewCount: number;
  rawText: string;
  dimensions: ReviewDimensionScores;
  summary: string;
  keywords: string[];
  deliveryFit: DeliveryFitLevel;
  deliveryFitNote: string;
  analyzedAt: string;
  createdAt: string;
  updatedAt: string;
}

/** 旧キー photoAppeal → photoGap */
export function normalizeReviewDimensions(
  dims: Partial<Record<string, number | null>> & ReviewDimensionScores,
): ReviewDimensionScores {
  const base = {} as ReviewDimensionScores;
  for (const k of REVIEW_DIMENSION_KEYS) {
    base[k] = dims[k] ?? null;
  }
  if (dims.photoGap == null && (dims as { photoAppeal?: number | null }).photoAppeal != null) {
    base.photoGap = (dims as { photoAppeal?: number | null }).photoAppeal ?? null;
  }
  return base;
}

export function reviewSearchText(r: StoreReview): string {
  return [r.summary, r.rawText, r.deliveryFitNote, ...r.keywords, r.area, r.businessType]
    .join(' ')
    .toLowerCase();
}
