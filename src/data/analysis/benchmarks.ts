import type { BenchmarkProfile, BenchmarkSegment, StoreAnalysisInput } from './types';
import { BENCHMARK_SEGMENT_LABELS } from './types';
import { inferPriceBand, PRICE_BAND_LABELS, type PriceBand } from './priceBand';

const UPDATED = '2026-05-19';

/**
 * エリア×業態ごとの「上位店」ベンチマーク（営業チーム手動調査ベース・MVP）
 * 自動スクレイピングではなく、訪問・地図・デリバリー掲載店の傾向から整備。
 */
export const BENCHMARKS: Record<string, BenchmarkProfile> = {
  '難波|韓国料理': {
    area: '難波',
    businessType: '韓国料理',
    sampleSize: 12,
    avgUnitPrice: 1480,
    avgProductCount: 28,
    avgSetRate: 62,
    avgLateNightRate: 45,
    avgReviewScore: 4.1,
    dataSourceNote: '難波エリア韓国料理・デリバリー掲載上位12店の平均（2026年5月手動調査）',
    updatedAt: UPDATED,
  },
  '心斎橋|韓国料理': {
    area: '心斎橋',
    businessType: '韓国料理',
    sampleSize: 10,
    avgUnitPrice: 1520,
    avgProductCount: 26,
    avgSetRate: 58,
    avgLateNightRate: 40,
    avgReviewScore: 4.0,
    dataSourceNote: '心斎橋韓国料理上位店10件平均',
    updatedAt: UPDATED,
  },
  '難波|居酒屋': {
    area: '難波',
    businessType: '居酒屋',
    sampleSize: 15,
    avgUnitPrice: 1680,
    avgProductCount: 42,
    avgSetRate: 55,
    avgLateNightRate: 72,
    avgReviewScore: 3.9,
    dataSourceNote: '難波居酒屋・夜帯需要が強い上位店15件',
    updatedAt: UPDATED,
  },
  '心斎橋|居酒屋': {
    area: '心斎橋',
    businessType: '居酒屋',
    sampleSize: 14,
    avgUnitPrice: 1750,
    avgProductCount: 38,
    avgSetRate: 52,
    avgLateNightRate: 68,
    avgReviewScore: 4.0,
    dataSourceNote: '心斎橋居酒屋上位14件',
    updatedAt: UPDATED,
  },
  '梅田|居酒屋': {
    area: '梅田',
    businessType: '居酒屋',
    sampleSize: 16,
    avgUnitPrice: 1820,
    avgProductCount: 40,
    avgSetRate: 58,
    avgLateNightRate: 65,
    avgReviewScore: 4.1,
    dataSourceNote: '梅田居酒屋上位16件',
    updatedAt: UPDATED,
  },
  '難波|ラーメン': {
    area: '難波',
    businessType: 'ラーメン',
    sampleSize: 18,
    avgUnitPrice: 980,
    avgProductCount: 14,
    avgSetRate: 48,
    avgLateNightRate: 55,
    avgReviewScore: 4.2,
    dataSourceNote: '難波ラーメン・デリバリー好調店18件',
    updatedAt: UPDATED,
  },
  '梅田|ラーメン': {
    area: '梅田',
    businessType: 'ラーメン',
    sampleSize: 15,
    avgUnitPrice: 1020,
    avgProductCount: 12,
    avgSetRate: 45,
    avgLateNightRate: 50,
    avgReviewScore: 4.1,
    dataSourceNote: '梅田ラーメン上位15件',
    updatedAt: UPDATED,
  },
  '心斎橋|カフェ': {
    area: '心斎橋',
    businessType: 'カフェ',
    sampleSize: 11,
    avgUnitPrice: 780,
    avgProductCount: 22,
    avgSetRate: 72,
    avgLateNightRate: 15,
    avgReviewScore: 4.3,
    dataSourceNote: '心斎橋カフェ・セット販売比率が高い上位店',
    updatedAt: UPDATED,
  },
  '梅田|カフェ': {
    area: '梅田',
    businessType: 'カフェ',
    sampleSize: 12,
    avgUnitPrice: 820,
    avgProductCount: 24,
    avgSetRate: 70,
    avgLateNightRate: 12,
    avgReviewScore: 4.2,
    dataSourceNote: '梅田カフェ上位12件',
    updatedAt: UPDATED,
  },
  '難波|焼肉': {
    area: '難波',
    businessType: '焼肉',
    sampleSize: 9,
    avgUnitPrice: 2280,
    avgProductCount: 35,
    avgSetRate: 65,
    avgLateNightRate: 58,
    avgReviewScore: 4.0,
    dataSourceNote: '難波焼肉・高単価セット中心の上位店',
    updatedAt: UPDATED,
  },
  '天王寺|焼肉': {
    area: '天王寺',
    businessType: '焼肉',
    sampleSize: 8,
    avgUnitPrice: 2180,
    avgProductCount: 32,
    avgSetRate: 60,
    avgLateNightRate: 52,
    avgReviewScore: 3.9,
    dataSourceNote: '天王寺焼肉上位8件',
    updatedAt: UPDATED,
  },
  '日本橋|中華': {
    area: '日本橋',
    businessType: '中華',
    sampleSize: 10,
    avgUnitPrice: 1180,
    avgProductCount: 30,
    avgSetRate: 50,
    avgLateNightRate: 48,
    avgReviewScore: 3.8,
    dataSourceNote: '日本橋中華・弁当需要が強い上位店',
    updatedAt: UPDATED,
  },
  '難波|弁当': {
    area: '難波',
    businessType: '弁当',
    sampleSize: 14,
    avgUnitPrice: 880,
    avgProductCount: 18,
    avgSetRate: 35,
    avgLateNightRate: 20,
    avgReviewScore: 4.0,
    dataSourceNote: '難波弁当・ランチ帯中心上位店',
    updatedAt: UPDATED,
  },
};

/** エリア×業態×セグメント（より細かい比較） */
export const SEGMENT_BENCHMARKS: Record<string, BenchmarkProfile> = {
  '難波|韓国料理|late_night': {
    area: '難波',
    businessType: '韓国料理',
    segment: 'late_night',
    segmentLabel: '深夜営業',
    sampleSize: 8,
    avgUnitPrice: 1620,
    avgProductCount: 22,
    avgSetRate: 58,
    avgLateNightRate: 78,
    avgReviewScore: 4.0,
    dataSourceNote: '難波×韓国料理×深夜営業型・22時以降需要が強い上位8店（2026年5月）',
    updatedAt: UPDATED,
  },
  '梅田|和食|lunch': {
    area: '梅田',
    businessType: '和食',
    segment: 'lunch',
    segmentLabel: 'ランチ型',
    sampleSize: 9,
    avgUnitPrice: 1420,
    avgProductCount: 20,
    avgSetRate: 48,
    avgLateNightRate: 12,
    avgReviewScore: 4.15,
    dataSourceNote: '梅田×和食×ランチ型・昼帯弁当・定食が強い上位9店',
    updatedAt: UPDATED,
  },
  '難波|居酒屋|late_night': {
    area: '難波',
    businessType: '居酒屋',
    segment: 'late_night',
    segmentLabel: '深夜営業',
    sampleSize: 11,
    avgUnitPrice: 1850,
    avgProductCount: 36,
    avgSetRate: 52,
    avgLateNightRate: 82,
    avgReviewScore: 3.95,
    dataSourceNote: '難波×居酒屋×深夜営業型・夜帯デリバリー好調11店',
    updatedAt: UPDATED,
  },
  '心斎橋|カフェ|lunch': {
    area: '心斎橋',
    businessType: 'カフェ',
    segment: 'lunch',
    segmentLabel: 'ランチ型',
    sampleSize: 7,
    avgUnitPrice: 720,
    avgProductCount: 18,
    avgSetRate: 78,
    avgLateNightRate: 8,
    avgReviewScore: 4.35,
    dataSourceNote: '心斎橋×カフェ×ランチ型・セット・スイーツ中心7店',
    updatedAt: UPDATED,
  },
  '梅田|ラーメン|lunch': {
    area: '梅田',
    businessType: 'ラーメン',
    segment: 'lunch',
    segmentLabel: 'ランチ型',
    sampleSize: 10,
    avgUnitPrice: 920,
    avgProductCount: 11,
    avgSetRate: 42,
    avgLateNightRate: 18,
    avgReviewScore: 4.1,
    dataSourceNote: '梅田×ラーメン×ランチ型・昼のテイクアウト需要10店',
    updatedAt: UPDATED,
  },
};

/** 業態のみのフォールバック平均 */
const BUSINESS_FALLBACK: Partial<Record<string, Omit<BenchmarkProfile, 'area'>>> = {
  韓国料理: { businessType: '韓国料理', sampleSize: 22, avgUnitPrice: 1500, avgProductCount: 27, avgSetRate: 60, avgLateNightRate: 42, avgReviewScore: 4.05, dataSourceNote: '大阪主要エリア韓国料理上位店の業態平均', updatedAt: UPDATED },
  居酒屋: { businessType: '居酒屋', sampleSize: 45, avgUnitPrice: 1720, avgProductCount: 40, avgSetRate: 54, avgLateNightRate: 68, avgReviewScore: 4.0, dataSourceNote: '大阪主要エリア居酒屋の業態平均', updatedAt: UPDATED },
  ラーメン: { businessType: 'ラーメン', sampleSize: 33, avgUnitPrice: 1000, avgProductCount: 13, avgSetRate: 46, avgLateNightRate: 52, avgReviewScore: 4.15, dataSourceNote: '大阪主要エリアラーメンの業態平均', updatedAt: UPDATED },
  カフェ: { businessType: 'カフェ', sampleSize: 23, avgUnitPrice: 800, avgProductCount: 23, avgSetRate: 71, avgLateNightRate: 14, avgReviewScore: 4.25, dataSourceNote: '大阪主要エリアカフェの業態平均', updatedAt: UPDATED },
  焼肉: { businessType: '焼肉', sampleSize: 17, avgUnitPrice: 2220, avgProductCount: 33, avgSetRate: 62, avgLateNightRate: 55, avgReviewScore: 3.95, dataSourceNote: '大阪主要エリア焼肉の業態平均', updatedAt: UPDATED },
  中華: { businessType: '中華', sampleSize: 10, avgUnitPrice: 1180, avgProductCount: 30, avgSetRate: 50, avgLateNightRate: 48, avgReviewScore: 3.8, dataSourceNote: '大阪主要エリア中華の業態平均', updatedAt: UPDATED },
  弁当: { businessType: '弁当', sampleSize: 14, avgUnitPrice: 880, avgProductCount: 18, avgSetRate: 35, avgLateNightRate: 20, avgReviewScore: 4.0, dataSourceNote: '大阪主要エリア弁当の業態平均', updatedAt: UPDATED },
  寿司: { businessType: '寿司', sampleSize: 8, avgUnitPrice: 1980, avgProductCount: 25, avgSetRate: 58, avgLateNightRate: 25, avgReviewScore: 4.2, dataSourceNote: '寿司業態の参考平均（サンプル少）', updatedAt: UPDATED },
  和食: { businessType: '和食', sampleSize: 10, avgUnitPrice: 1650, avgProductCount: 28, avgSetRate: 52, avgLateNightRate: 30, avgReviewScore: 4.1, dataSourceNote: '和食業態の参考平均', updatedAt: UPDATED },
};

const GLOBAL_FALLBACK: BenchmarkProfile = {
  area: '大阪主要エリア',
  businessType: '飲食店全体',
  sampleSize: 50,
  avgUnitPrice: 1350,
  avgProductCount: 28,
  avgSetRate: 52,
  avgLateNightRate: 45,
  avgReviewScore: 4.0,
  dataSourceNote: '大阪飲食・デリバリー掲載店の広域参考値（精度はエリア×業態より低い）',
  updatedAt: UPDATED,
};

export function benchmarkKey(area: string, businessType: string): string {
  return `${area}|${businessType}`;
}

export function benchmarkSegmentKey(
  area: string,
  businessType: string,
  segment: BenchmarkSegment,
): string {
  return `${area}|${businessType}|${segment}`;
}

export function resolveBenchmark(
  area: string,
  businessType: string,
  segment: BenchmarkSegment = 'standard',
): {
  profile: BenchmarkProfile;
  matchLevel: 'exact' | 'segment' | 'business' | 'global';
  segmentUsed: BenchmarkSegment;
} {
  if (segment !== 'standard') {
    const seg = SEGMENT_BENCHMARKS[benchmarkSegmentKey(area, businessType, segment)];
    if (seg) return { profile: seg, matchLevel: 'segment', segmentUsed: segment };
  }

  const exact = BENCHMARKS[benchmarkKey(area, businessType)];
  if (exact) return { profile: exact, matchLevel: 'exact', segmentUsed: 'standard' };

  const biz = BUSINESS_FALLBACK[businessType];
  if (biz) {
    return {
      profile: { area, ...biz } as BenchmarkProfile,
      matchLevel: 'business',
      segmentUsed: segment,
    };
  }

  return {
    profile: { ...GLOBAL_FALLBACK, area, businessType },
    matchLevel: 'global',
    segmentUsed: segment,
  };
}

export function formatBenchmarkCondition(
  area: string,
  businessType: string,
  segment: BenchmarkSegment,
  priceBand: PriceBand,
): string {
  const segLabel = BENCHMARK_SEGMENT_LABELS[segment];
  const priceLabel = PRICE_BAND_LABELS[priceBand];
  const salesType = segment === 'standard' ? '標準営業型' : segLabel;
  return `${area} × ${businessType} × ${priceLabel} × ${salesType}`;
}

function tuneProfileForPriceBand(profile: BenchmarkProfile, band: PriceBand): BenchmarkProfile {
  const mult = band === 'high' ? 1.06 : band === 'low' ? 0.94 : 1;
  return {
    ...profile,
    avgUnitPrice: Math.round(profile.avgUnitPrice * mult),
    dataSourceNote: `${profile.dataSourceNote}（比較: ${PRICE_BAND_LABELS[band]}）`,
  };
}

/** エリア×業態×価格帯×営業タイプでベンチマーク解決 */
export function resolveBenchmarkFromInput(input: StoreAnalysisInput, segment: BenchmarkSegment): {
  profile: BenchmarkProfile;
  matchLevel: 'exact' | 'segment' | 'business' | 'global';
  segmentUsed: BenchmarkSegment;
  priceBand: PriceBand;
} {
  const priceBand = inferPriceBand(input);
  const resolved = resolveBenchmark(input.area, input.businessType, segment);
  return {
    ...resolved,
    profile: tuneProfileForPriceBand(resolved.profile, priceBand),
    priceBand,
  };
}
