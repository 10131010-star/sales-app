import type { GoogleMapsInfo } from '@/data/googleMaps/types';
import { emptyGoogleMapsInfo, hasGoogleMapsData } from '@/data/googleMaps/types';
import { validateGoogleMapsInfo } from '@/lib/googleMaps/validate';

const PREFIX = 'sales-app:google-maps:';

/** localStorage 保存（将来 Supabase google_maps テーブルへ移行しやすい JSON） */
export function loadGoogleMapsInfo(storeId: string): GoogleMapsInfo {
  try {
    const raw = localStorage.getItem(PREFIX + storeId);
    if (!raw) return emptyGoogleMapsInfo(storeId);
    const parsed = JSON.parse(raw) as Partial<GoogleMapsInfo>;
    const { normalized } = validateGoogleMapsInfo(storeId, { ...parsed, storeId });
    if (!hasGoogleMapsData(normalized) && normalized.dataStatus !== 'captured') {
      return { ...normalized, dataStatus: 'unconfirmed' };
    }
    return normalized;
  } catch {
    return emptyGoogleMapsInfo(storeId);
  }
}

export function saveGoogleMapsInfo(info: GoogleMapsInfo): GoogleMapsInfo {
  const { normalized, valid, errors } = validateGoogleMapsInfo(info.storeId, info);
  if (!valid) {
    console.warn('Google Maps validation warnings', errors);
  }
  localStorage.setItem(PREFIX + info.storeId, JSON.stringify(normalized));
  return normalized;
}

/** Supabase 行 → アプリ型（将来用） */
export function googleMapsFromRow(row: Record<string, unknown>): GoogleMapsInfo {
  const storeId = String(row.store_id ?? '');
  return validateGoogleMapsInfo(storeId, {
    storeId,
    mapsUrl: String(row.maps_url ?? ''),
    placeName: String(row.place_name ?? ''),
    address: String(row.address ?? ''),
    genre: String(row.genre ?? ''),
    rating: row.rating != null ? Number(row.rating) : null,
    reviewCount: row.review_count != null ? Number(row.review_count) : null,
    hours: String(row.hours ?? ''),
    photoCount: row.photo_count != null ? Number(row.photo_count) : null,
    latestReviews: String(row.latest_reviews ?? ''),
    positiveTrend: String(row.positive_trend ?? ''),
    negativeTrend: String(row.negative_trend ?? ''),
    dataStatus: (row.data_status as GoogleMapsInfo['dataStatus']) ?? 'manual',
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  }).normalized;
}

export function googleMapsToRow(info: GoogleMapsInfo): Record<string, unknown> {
  return {
    store_id: info.storeId,
    maps_url: info.mapsUrl,
    place_name: info.placeName,
    address: info.address,
    genre: info.genre,
    rating: info.rating,
    review_count: info.reviewCount,
    hours: info.hours,
    photo_count: info.photoCount,
    latest_reviews: info.latestReviews,
    positive_trend: info.positiveTrend,
    negative_trend: info.negativeTrend,
    data_status: info.dataStatus,
    updated_at: info.updatedAt,
  };
}
