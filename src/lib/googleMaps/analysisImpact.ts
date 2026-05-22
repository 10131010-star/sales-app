import type { GoogleMapsInfo } from '@/data/googleMaps/types';
import { hasGoogleMapsData } from '@/data/googleMaps/types';
import type { StoreAnalysisInput, StoreAnalysisResult } from '@/data/analysis/types';

/** 分析入力に Google Maps 数値・信頼度を反映 */
export function mergeInputWithGoogleMaps(
  input: StoreAnalysisInput,
  maps: GoogleMapsInfo | null,
): StoreAnalysisInput {
  if (!maps || !hasGoogleMapsData(maps)) return input;

  return {
    ...input,
    name: maps.placeName || input.name,
    area: input.area,
    businessType: maps.genre || input.businessType,
    reviewScore: maps.rating ?? input.reviewScore,
    confidence: {
      ...input.confidence,
      googleMaps: true,
      reviewCheck: maps.latestReviews.trim() || maps.positiveTrend ? true : input.confidence.reviewCheck,
      photoCheck: (maps.photoCount ?? 0) > 0 ? true : input.confidence.photoCheck,
    },
  };
}

/** スコア・強み懸念への加算（断定なし） */
export function applyGoogleMapsToResult(
  base: StoreAnalysisResult,
  maps: GoogleMapsInfo | null,
): Partial<StoreAnalysisResult> {
  if (!maps || !hasGoogleMapsData(maps)) {
    return {
      strengths: [...base.strengths],
      concerns: [
        ...base.concerns,
        'Google Maps情報は未確認です。比較上、地図・口コミの手入力があると分析精度が上がる可能性があります。',
      ],
    };
  }

  const strengths = [...base.strengths];
  const concerns = [...base.concerns];
  const recommendations = [...base.recommendations];
  let overallScore = base.overallScore;

  if (maps.rating != null && maps.rating >= 4) {
    strengths.push(
      `Google Maps上の口コミ傾向から見ると、評価★${maps.rating}は比較的良好で、品質面の訴求材料になりやすい傾向があります。`,
    );
    overallScore = Math.min(100, overallScore + 2);
  }

  if ((maps.reviewCount ?? 0) >= 50) {
    strengths.push(
      `Google Maps上では口コミ件数が${maps.reviewCount}件と比較的多く、確認できる範囲では認知・信頼の材料になりやすい傾向があります。`,
    );
    overallScore = Math.min(100, overallScore + 1);
  }

  if (maps.positiveTrend.trim()) {
    strengths.push(`Google Mapsのポジティブ傾向: ${maps.positiveTrend.slice(0, 80)}${maps.positiveTrend.length > 80 ? '…' : ''}`);
  }

  if (maps.negativeTrend.trim()) {
    const neg = maps.negativeTrend;
    if (/速度|待ち|遅|混雑/.test(neg)) {
      concerns.push(
        `Google Maps上の口コミ傾向から見ると、提供速度・待ちに関する不満が見られます（${neg.slice(0, 50)}…）。`,
      );
      recommendations.push(
        '比較上は、調理負荷の低い商品・時間帯限定から始める提案に改善余地があります。',
      );
      overallScore = Math.max(0, overallScore - 2);
    } else {
      concerns.push(`Google Mapsのネガティブ傾向: ${neg.slice(0, 80)}…`);
    }
  }

  if (maps.genre && maps.genre !== base.input.businessType) {
    recommendations.push(
      `Google Mapsのジャンル表記は「${maps.genre}」です。比較上、ベンチマーク業態との整合を確認する価値があります。`,
    );
  }

  return {
    overallScore,
    strengths: strengths.slice(0, 7),
    concerns: concerns.slice(0, 7),
    recommendations: [...new Set(recommendations)].slice(0, 10),
  };
}
