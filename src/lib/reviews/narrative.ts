import type { ReviewDimensionKey, StoreReview } from '@/data/reviews/types';
import { REVIEW_DIMENSION_LABELS } from '@/data/reviews/types';

function isStrong(v: number | null): boolean {
  return v != null && v >= 4;
}

function isWeak(v: number | null): boolean {
  return v != null && v <= 2.5;
}

/** 口コミ軸から提案型の文章を生成（断定なし） */
export function buildReviewBasedProposals(review: StoreReview): string[] {
  const d = review.dimensions;
  const proposals: string[] = [];

  const tasteOk = isStrong(d.taste);
  const speedWeak = isWeak(d.speed);
  const waitWeak = isWeak(d.waitTime);
  const photoWeak = isWeak(d.photoGap);
  const delOk = isStrong(d.deliverySuitability);
  const volumeOk = isStrong(d.volume);

  if (tasteOk && (speedWeak || waitWeak)) {
    proposals.push(
      '口コミ傾向から見ると、味への評価が比較的高い一方、提供速度や待ち時間への不満が見られます。そのため、全メニュー掲載ではなく、調理負荷の低い商品から始める提案が適している可能性があります。',
    );
  }

  if (photoWeak) {
    proposals.push(
      '口コミでは写真との差に関する指摘があるため、比較上はデリバリー専用の撮影・盛り付け見直しを先に行うと、期待値コントロールに有効な可能性があります。',
    );
  }

  if (delOk && tasteOk) {
    proposals.push(
      '口コミ傾向から見ると、デリバリー適性と味の評価がともに良好です。上位店傾向から見ると、人気商品を中心に段階的に掲載を広げる進め方と相性が良い可能性があります。',
    );
  }

  if (isWeak(d.price) && volumeOk) {
    proposals.push(
      '価格面の不満が見られる一方、ボリューム評価は比較的良好です。比較上はセット・大盛り訴求より、見え方の価格設計（セット化）に改善余地がある可能性があります。',
    );
  }

  if (isWeak(d.service)) {
    proposals.push(
      '接客面の口コミに懸念があるため、デリバリー導入時はオペレーション負担を抑える時間帯限定の提案から始めると、現場の負担軽減につながる可能性があります。',
    );
  }

  if (proposals.length === 0) {
    proposals.push(
      `口コミ傾向から見ると、デリバリー適性は【${review.deliveryFit}】の参考値です。${review.summary}。比較上、小さく始めるテスト導入で現場負担を確認する進め方に改善余地があります。`,
    );
  }

  return proposals.slice(0, 4);
}

export function buildReviewContrastSummary(review: StoreReview): string {
  const highs: string[] = [];
  const lows: string[] = [];
  for (const [key, label] of Object.entries(REVIEW_DIMENSION_LABELS) as [ReviewDimensionKey, string][]) {
    const v = review.dimensions[key];
    if (v == null) continue;
    if (v >= 4) highs.push(label);
    if (v <= 2.5) lows.push(label);
  }
  if (highs.length === 0 && lows.length === 0) return review.summary;
  const highPart = highs.length > 0 ? `${highs.join('・')}への評価が相対的に高め` : '';
  const lowPart = lows.length > 0 ? `${lows.join('・')}への不満が見られる` : '';
  if (highPart && lowPart) {
    return `口コミ傾向から見ると、${highPart}の一方、${lowPart}傾向があります。`;
  }
  if (highPart) return `口コミ傾向から見ると、${highPart}です。`;
  return `口コミ傾向から見ると、${lowPart}傾向があります。`;
}
