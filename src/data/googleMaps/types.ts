/** データの入力状態 */
export type GoogleMapsDataStatus = 'unconfirmed' | 'manual' | 'captured';

export const GOOGLE_MAPS_STATUS_LABELS: Record<GoogleMapsDataStatus, string> = {
  unconfirmed: '未確認',
  manual: '手入力',
  captured: '取得済み',
};

/** 店舗に紐づく Google Maps 情報（Supabase 移行用フラット構造） */
export interface GoogleMapsInfo {
  storeId: string;
  mapsUrl: string;
  placeName: string;
  address: string;
  genre: string;
  rating: number | null;
  reviewCount: number | null;
  hours: string;
  photoCount: number | null;
  latestReviews: string;
  positiveTrend: string;
  negativeTrend: string;
  dataStatus: GoogleMapsDataStatus;
  updatedAt: string;
}

export function emptyGoogleMapsInfo(storeId: string): GoogleMapsInfo {
  return {
    storeId,
    mapsUrl: '',
    placeName: '',
    address: '',
    genre: '',
    rating: null,
    reviewCount: null,
    hours: '',
    photoCount: null,
    latestReviews: '',
    positiveTrend: '',
    negativeTrend: '',
    dataStatus: 'unconfirmed',
    updatedAt: new Date().toISOString(),
  };
}

/** 分析に使える最低限の入力があるか */
export function hasGoogleMapsData(info: GoogleMapsInfo): boolean {
  return (
    info.dataStatus !== 'unconfirmed' &&
    (info.rating != null ||
      (info.reviewCount != null && info.reviewCount > 0) ||
      info.positiveTrend.trim().length > 0 ||
      info.negativeTrend.trim().length > 0 ||
      info.latestReviews.trim().length > 0)
  );
}
