import type { GoogleMapsInfo } from '@/data/googleMaps/types';
import { GOOGLE_MAPS_STATUS_LABELS, hasGoogleMapsData } from '@/data/googleMaps/types';

/** Google Maps 根拠に基づく提案型文章 */
export function buildGoogleMapsProposals(info: GoogleMapsInfo): string[] {
  if (!hasGoogleMapsData(info)) return [];

  const proposals: string[] = [];
  const rating = info.rating;
  const reviews = info.reviewCount ?? 0;
  const pos = info.positiveTrend.toLowerCase();
  const neg = info.negativeTrend.toLowerCase();

  const tastePositive = /味|おいし|美味|コスパ/.test(pos);
  const speedNegative = /提供|速度|遅い|待ち|出るのが遅/.test(neg);
  const manyReviews = reviews >= 30;
  const highRating = rating != null && rating >= 4;

  if (manyReviews && highRating && tastePositive) {
    proposals.push(
      'Google Maps上の口コミ傾向から見ると、レビュー件数が比較的多く、味への評価が確認できる範囲では訴求材料になりやすい傾向があります。',
    );
  } else if (highRating && reviews >= 10) {
    proposals.push(
      'Google Maps上では評価が比較的良好です。確認できる範囲では、品質面を前面に出した提案が適している可能性があります。',
    );
  }

  if (speedNegative || /待ち|混雑/.test(neg)) {
    proposals.push(
      '一方で、提供速度や待ち時間への不満が見られるため、上位店傾向から見ると、導入初期は調理負荷の低い商品に絞る提案が適している可能性があります。',
    );
  } else if (tastePositive && !speedNegative) {
    proposals.push(
      '口コミ傾向と合わせ、比較上は人気商品を中心に段階的に掲載を広げる進め方に改善余地があります。',
    );
  }

  if (info.photoCount != null && info.photoCount >= 20) {
    proposals.push(
      'Google Maps上で写真枚数が比較的多いため、確認できる範囲ではデリバリー用写真の転用・最適化がしやすい傾向があります。',
    );
  } else if (info.photoCount != null && info.photoCount < 5) {
    proposals.push(
      '写真枚数が少なめのため、比較上は掲載前の写真整備に改善余地があります。',
    );
  }

  if (info.hours.includes('22') || info.hours.includes('23') || info.hours.includes('24')) {
    proposals.push(
      '営業時間の記載から深夜帯の稼働がある可能性があります。上位店傾向から見ると、夜帯限定のテスト導入と相性を確認する価値があります。',
    );
  }

  if (proposals.length === 0) {
    proposals.push(
      `Google Maps情報（${GOOGLE_MAPS_STATUS_LABELS[info.dataStatus]}）を参照しました。確認できる範囲では、小さく始めるテスト導入で現場負担を見極める提案に改善余地があります。`,
    );
  }

  return proposals.slice(0, 4);
}

export function buildGoogleMapsContrastSummary(info: GoogleMapsInfo): string {
  if (!hasGoogleMapsData(info)) {
    return 'Google Maps情報は未確認です。手入力または取得後に分析精度が上がります。';
  }
  const parts: string[] = [];
  if (info.rating != null) parts.push(`評価★${info.rating}`);
  if (info.reviewCount != null) parts.push(`口コミ${info.reviewCount}件`);
  if (info.positiveTrend) parts.push(`良い傾向: ${info.positiveTrend.slice(0, 40)}`);
  if (info.negativeTrend) parts.push(`懸念傾向: ${info.negativeTrend.slice(0, 40)}`);
  return `Google Maps上の口コミ傾向から見ると、${parts.join(' / ')}（${GOOGLE_MAPS_STATUS_LABELS[info.dataStatus]}）。`;
}
