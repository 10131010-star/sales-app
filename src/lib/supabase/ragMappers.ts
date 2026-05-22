import type { SalesLog, SalesLogOutcome } from '@/data/salesLog/types';
import { normalizeReviewDimensions, type StoreReview } from '@/data/reviews/types';

export function mapSalesLog(row: Record<string, unknown>): SalesLog {
  return {
    id: String(row.id),
    storeId: row.store_id ? String(row.store_id) : null,
    memberId: (row.member_id as SalesLog['memberId']) ?? 'nakata',
    visitedAt: String(row.visited_at ?? row.created_at),
    area: String(row.area ?? ''),
    businessType: String(row.business_type ?? ''),
    outcome: (row.outcome as SalesLogOutcome) ?? '保留',
    objectionHeard: String(row.objection_heard ?? ''),
    hitProposal: String(row.hit_proposal ?? ''),
    dislikedPoint: String(row.disliked_point ?? ''),
    ownerReaction: String(row.owner_reaction ?? ''),
    nextAction: String(row.next_action ?? ''),
    quickMemo: String(row.quick_memo ?? ''),
    negotiationMemo: String(row.negotiation_memo ?? ''),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at ?? row.created_at),
  };
}

export function salesLogToRow(log: SalesLog): Record<string, unknown> {
  return {
    id: log.id,
    store_id: log.storeId,
    member_id: log.memberId,
    visited_at: log.visitedAt,
    area: log.area,
    business_type: log.businessType,
    outcome: log.outcome,
    objection_heard: log.objectionHeard,
    hit_proposal: log.hitProposal,
    disliked_point: log.dislikedPoint,
    owner_reaction: log.ownerReaction,
    next_action: log.nextAction,
    quick_memo: log.quickMemo,
    negotiation_memo: log.negotiationMemo,
    search_text: [
      log.area,
      log.businessType,
      log.outcome,
      log.objectionHeard,
      log.hitProposal,
      log.dislikedPoint,
      log.ownerReaction,
      log.nextAction,
      log.quickMemo,
      log.negotiationMemo,
    ]
      .join(' ')
      .toLowerCase(),
  };
}

export function mapStoreReview(row: Record<string, unknown>): StoreReview {
  const dimJson = (row.dimensions_json ?? {}) as Record<string, number | null>;
  const dimensions = normalizeReviewDimensions(dimJson as StoreReview['dimensions']);
  return {
    id: String(row.id),
    storeId: row.store_id ? String(row.store_id) : null,
    storeName: String(row.store_name ?? ''),
    area: String(row.area ?? ''),
    businessType: String(row.business_type ?? ''),
    rating: Number(row.rating ?? 0),
    reviewCount: Number(row.review_count ?? 0),
    rawText: String(row.raw_text ?? row.summary ?? ''),
    dimensions,
    summary: String(row.summary ?? ''),
    keywords: (row.keywords as string[]) ?? [],
    deliveryFit: (row.delivery_fit as StoreReview['deliveryFit']) ?? '要確認',
    deliveryFitNote: String(row.delivery_fit_note ?? ''),
    analyzedAt: String(row.analyzed_at),
    createdAt: String(row.created_at ?? row.analyzed_at),
    updatedAt: String(row.updated_at ?? row.analyzed_at),
  };
}

export function storeReviewToRow(r: StoreReview): Record<string, unknown> {
  return {
    id: r.id,
    store_id: r.storeId,
    store_name: r.storeName,
    area: r.area,
    business_type: r.businessType,
    rating: r.rating,
    review_count: r.reviewCount,
    raw_text: r.rawText,
    dimensions_json: r.dimensions,
    summary: r.summary,
    keywords: r.keywords,
    delivery_fit: r.deliveryFit,
    delivery_fit_note: r.deliveryFitNote,
    search_text: [r.summary, r.rawText, r.deliveryFitNote, ...r.keywords].join(' ').toLowerCase(),
    analyzed_at: r.analyzedAt,
  };
}
