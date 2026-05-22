import type {
  DeliveryFitLevel,
  ReviewDimensionKey,
  ReviewDimensionScores,
  StoreReview,
} from '@/data/reviews/types';
import { REVIEW_DIMENSION_KEYS, REVIEW_DIMENSION_LABELS } from '@/data/reviews/types';

type DimRule = { key: ReviewDimensionKey; positive: string[]; negative: string[] };

const RULES: DimRule[] = [
  { key: 'taste', positive: ['美味', 'おいし', 'うま', '絶品', '本格的'], negative: ['まず', '味が薄', 'しょっぱ', '不味', 'パサ'] },
  { key: 'price', positive: ['安い', 'コスパ', 'お得', 'リーズナブル'], negative: ['高い', '割高', '値段が', '高すぎ'] },
  { key: 'volume', positive: ['ボリューム', '量', '大盛', '満足', 'たっぷり', '多い'], negative: ['少な', '小さい', '物足り', '少ない'] },
  { key: 'speed', positive: ['早い', '速い', 'すぐ', '提供が早', 'テイクアウト'], negative: ['遅い', '待たされた', '出るのが遅', '時間がかか'] },
  { key: 'service', positive: ['親切', '丁寧', '接客', '笑顔', '気配り'], negative: ['態度', '無愛想', '冷た', '接客が悪', '無視'] },
  {
    key: 'photoGap',
    positive: ['写真通り', 'イメージ通り', '実物も綺麗'],
    negative: ['写真と違', 'イメージと違', '盛りが少', '写真詐欺', '見た目が残念', '実物が小さ'],
  },
  { key: 'waitTime', positive: ['待ち時間短', 'すぐ案内', '待たない'], negative: ['待ち', '行列', '1時間', '混んで', '待たされた'] },
  {
    key: 'deliverySuitability',
    positive: ['テイクアウト', '持ち帰り', 'デリバリー', '出前', 'Uber', '配達', '家で', '弁当', 'パック'],
    negative: ['店内のみ', '席が狭', 'パック不向き', '汁が漏', '冷め', 'デリバリー向きでない'],
  },
];

function scoreDimension(text: string, rule: DimRule): number | null {
  let pos = 0;
  let neg = 0;
  for (const w of rule.positive) if (text.includes(w)) pos++;
  for (const w of rule.negative) if (text.includes(w)) neg++;
  if (pos === 0 && neg === 0) return null;
  const raw = 3 + (pos - neg) * 0.8;
  return Math.max(1, Math.min(5, Math.round(raw * 10) / 10));
}

export function extractDimensions(rawText: string): ReviewDimensionScores {
  const text = rawText.toLowerCase();
  const scores = {} as ReviewDimensionScores;
  for (const rule of RULES) {
    scores[rule.key] = scoreDimension(text, rule);
  }
  return scores;
}

export function mergeDimensions(
  auto: ReviewDimensionScores,
  manual: Partial<ReviewDimensionScores>,
): ReviewDimensionScores {
  const merged = { ...auto };
  for (const k of REVIEW_DIMENSION_KEYS) {
    if (manual[k] != null) merged[k] = manual[k];
  }
  return merged;
}

export function assessDeliveryFit(
  dimensions: ReviewDimensionScores,
  _rawText: string,
  rating: number,
): { level: DeliveryFitLevel; note: string } {
  const delScore = dimensions.deliverySuitability ?? 3;
  const speed = dimensions.speed ?? 3;
  const taste = dimensions.taste ?? 3;
  const wait = dimensions.waitTime ?? 3;
  const photoGap = dimensions.photoGap ?? 3;

  let score = 0;
  const reasons: string[] = [];

  if (delScore >= 4) {
    score += 1.5;
    reasons.push('デリバリー適性の評価が比較的良好');
  } else if (delScore <= 2) {
    score -= 1;
    reasons.push('デリバリー適性に関する懸念の記述あり');
  }

  if (taste >= 4) {
    score += 1;
    reasons.push('味への評価がデリバリー訴求に使いやすい傾向');
  } else if (taste <= 2) {
    reasons.push('味面の不満が見られる傾向');
  }

  if (speed >= 4) {
    score += 0.5;
    reasons.push('提供速度の評価が良好');
  } else if (speed <= 2) {
    score -= 1;
    reasons.push('提供速度・待ちに関する不満の記述あり');
  }

  if (wait <= 2) score -= 0.5;
  if (photoGap <= 2) {
    score -= 0.5;
    reasons.push('写真とのギャップに関する指摘あり');
  }
  if (rating >= 4) score += 0.5;
  if (rating < 3.5) score -= 0.5;

  let level: DeliveryFitLevel;
  if (score >= 2.5) level = '高い可能性';
  else if (score >= 1.5) level = 'やや高い';
  else if (score >= 0) level = '要確認';
  else if (score >= -1) level = 'やや低い';
  else level = '低い可能性';

  const note =
    reasons.length > 0
      ? `口コミ傾向から見ると、デリバリー適性は【${level}】です。${reasons.join('。')}。（断定ではなく参考）`
      : `口コミ件数・評価から、デリバリー適性は【${level}】の参考値です。`;

  return { level, note };
}

export function buildReviewSummary(dimensions: ReviewDimensionScores): string {
  const parts: string[] = [];
  for (const key of REVIEW_DIMENSION_KEYS) {
    const v = dimensions[key];
    if (v == null) continue;
    const label = REVIEW_DIMENSION_LABELS[key];
    parts.push(`${label}${v >= 4 ? '◎' : v >= 3 ? '○' : '△'}(${v})`);
  }
  return parts.length > 0 ? parts.join(' · ') : '（軸別の抽出なし）';
}

export function analyzeReviewText(params: {
  storeId: string | null;
  storeName: string;
  area: string;
  businessType: string;
  rating: number;
  reviewCount: number;
  rawText: string;
  manualDimensions?: Partial<ReviewDimensionScores>;
}): Omit<StoreReview, 'id' | 'createdAt' | 'updatedAt' | 'analyzedAt'> {
  const auto = extractDimensions(params.rawText);
  const dimensions = mergeDimensions(auto, params.manualDimensions ?? {});
  const { level, note } = assessDeliveryFit(dimensions, params.rawText, params.rating);
  const keywords = params.rawText
    .split(/[\s、。]+/)
    .filter((w) => w.length >= 2)
    .slice(0, 12);

  return {
    storeId: params.storeId,
    storeName: params.storeName,
    area: params.area,
    businessType: params.businessType,
    rating: params.rating,
    reviewCount: params.reviewCount,
    rawText: params.rawText,
    dimensions,
    summary: buildReviewSummary(dimensions),
    keywords,
    deliveryFit: level,
    deliveryFitNote: note,
  };
}
