import type { GoogleMapsInfo } from '@/data/googleMaps/types';
import { emptyGoogleMapsInfo } from '@/data/googleMaps/types';

export interface GoogleMapsValidation {
  valid: boolean;
  errors: Partial<Record<keyof GoogleMapsInfo, string>>;
  normalized: GoogleMapsInfo;
}

const MAPS_URL_PATTERN = /^https?:\/\/(www\.)?(google\.[a-z.]+\/maps|maps\.google\.)/i;

function clampRating(v: number | null | undefined): number | null {
  if (v == null || Number.isNaN(v)) return null;
  return Math.max(0, Math.min(5, Math.round(v * 10) / 10));
}

function clampNonNegativeInt(v: number | null | undefined): number | null {
  if (v == null || Number.isNaN(v)) return null;
  return Math.max(0, Math.floor(v));
}

function safeStr(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

export function validateGoogleMapsInfo(
  storeId: string,
  raw: Partial<GoogleMapsInfo>,
): GoogleMapsValidation {
  const errors: Partial<Record<keyof GoogleMapsInfo, string>> = {};
  const base = emptyGoogleMapsInfo(storeId);

  const mapsUrl = safeStr(raw.mapsUrl).trim();
  if (mapsUrl && !MAPS_URL_PATTERN.test(mapsUrl)) {
    errors.mapsUrl = 'Google Maps の URL 形式を確認してください';
  }

  const rating = clampRating(raw.rating ?? null);
  const reviewCount = clampNonNegativeInt(raw.reviewCount ?? null);
  const photoCount = clampNonNegativeInt(raw.photoCount ?? null);

  if (raw.rating != null && Number.isNaN(Number(raw.rating))) {
    errors.rating = '評価は数値で入力してください';
  }
  if (raw.reviewCount != null && Number.isNaN(Number(raw.reviewCount))) {
    errors.reviewCount = 'レビュー件数は数値で入力してください';
  }
  if (raw.photoCount != null && Number.isNaN(Number(raw.photoCount))) {
    errors.photoCount = '写真枚数は数値で入力してください';
  }

  const positiveTrend = safeStr(raw.positiveTrend).trim();
  const negativeTrend = safeStr(raw.negativeTrend).trim();
  const latestReviews = safeStr(raw.latestReviews).trim();
  const placeName = safeStr(raw.placeName).trim();
  const genre = safeStr(raw.genre).trim();

  const hasContent =
    mapsUrl.length > 0 ||
    placeName.length > 0 ||
    rating != null ||
    (reviewCount != null && reviewCount > 0) ||
    positiveTrend.length > 0 ||
    negativeTrend.length > 0 ||
    latestReviews.length > 0;

  let dataStatus = raw.dataStatus ?? base.dataStatus;
  if (!hasContent) {
    dataStatus = 'unconfirmed';
  } else if (dataStatus === 'unconfirmed') {
    dataStatus = 'manual';
  }

  const normalized: GoogleMapsInfo = {
    storeId,
    mapsUrl,
    placeName: placeName || safeStr(raw.placeName),
    address: safeStr(raw.address).trim(),
    genre,
    rating,
    reviewCount,
    hours: safeStr(raw.hours).trim(),
    photoCount,
    latestReviews,
    positiveTrend,
    negativeTrend,
    dataStatus,
    updatedAt: new Date().toISOString(),
  };

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    normalized,
  };
}
