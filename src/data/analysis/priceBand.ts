import type { StoreAnalysisInput } from '@/data/analysis/types';

export type PriceBand = 'low' | 'mid' | 'high';

export const PRICE_BAND_LABELS: Record<PriceBand, string> = {
  low: '低価格帯',
  mid: '中価格帯',
  high: '高価格帯',
};

/** 業態ごとの単価目安（円）で価格帯を推定 */
const BAND_THRESHOLDS: Partial<Record<string, { low: number; high: number }>> = {
  ラーメン: { low: 900, high: 1200 },
  カフェ: { low: 700, high: 950 },
  弁当: { low: 750, high: 1000 },
  韓国料理: { low: 1200, high: 1700 },
  居酒屋: { low: 1500, high: 2000 },
  焼肉: { low: 2000, high: 2800 },
  寿司: { low: 1800, high: 2500 },
  和食: { low: 1300, high: 1900 },
};

const DEFAULT_THRESHOLDS = { low: 1000, high: 1600 };

export function inferPriceBand(input: Pick<StoreAnalysisInput, 'avgUnitPrice' | 'businessType'>): PriceBand {
  const t = BAND_THRESHOLDS[input.businessType] ?? DEFAULT_THRESHOLDS;
  if (input.avgUnitPrice < t.low) return 'low';
  if (input.avgUnitPrice >= t.high) return 'high';
  return 'mid';
}
