import type { KnowledgeItem, SalesRecord, SalesTarget, Store } from '@/data/types';
import type { AdoptionStatus, SalesMemberId } from '@/data/constants';

/* eslint-disable @typescript-eslint/no-explicit-any */

export function mapStore(row: any): Store {
  return {
    id: row.id,
    name: row.name ?? '',
    area: row.area ?? '',
    address: row.address ?? '',
    businessType: row.business_type ?? '',
    hours: row.hours ?? '',
    phone: row.phone ?? '',
    instagramUrl: row.instagram_url ?? '',
    googleMapUrl: row.google_map_url ?? '',
    reviewSiteUrl: row.review_site_url ?? '',
    assigneeId: row.assignee_id as SalesMemberId,
    adoptionStatus: row.adoption_status as AdoptionStatus,
    priority: row.priority ?? '中',
    salesMemo: row.sales_memo ?? '',
    rejectionReason: row.rejection_reason ?? '',
    nextAction: row.next_action ?? '',
    nextContactDate: row.next_contact_date ?? null,
    lastContactDate: row.last_contact_date ?? null,
    transcriptionText: row.transcription_text ?? '',
    aiMemoRaw: row.ai_memo_raw ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function storeToRow(s: Partial<Store>): Record<string, unknown> {
  return {
    name: s.name,
    area: s.area,
    address: s.address,
    business_type: s.businessType,
    hours: s.hours,
    phone: s.phone,
    instagram_url: s.instagramUrl,
    google_map_url: s.googleMapUrl,
    review_site_url: s.reviewSiteUrl,
    assignee_id: s.assigneeId,
    adoption_status: s.adoptionStatus,
    priority: s.priority,
    sales_memo: s.salesMemo,
    rejection_reason: s.rejectionReason,
    next_action: s.nextAction,
    next_contact_date: s.nextContactDate || null,
    last_contact_date: s.lastContactDate || null,
    transcription_text: s.transcriptionText,
    ai_memo_raw: s.aiMemoRaw,
    updated_at: new Date().toISOString(),
  };
}

export function mapRecord(row: any): SalesRecord {
  return {
    id: row.id,
    recordDate: row.record_date,
    memberId: row.member_id as SalesMemberId,
    storeId: row.store_id,
    area: row.area ?? '',
    visits: row.visits ?? 0,
    frontOk: row.front_ok ?? 0,
    metManager: row.met_manager ?? 0,
    fullTalk: row.full_talk ?? 0,
    prospect: row.prospect ?? 0,
    appointment: row.appointment ?? 0,
    verbalOk: row.verbal_ok ?? 0,
    won: row.won ?? 0,
    quickMemo: row.quick_memo ?? '',
    negotiationMemo: row.negotiation_memo ?? '',
    transcriptionText: row.transcription_text ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function recordToRow(r: Partial<SalesRecord>): Record<string, unknown> {
  return {
    record_date: r.recordDate,
    member_id: r.memberId,
    store_id: r.storeId || null,
    area: r.area,
    visits: r.visits,
    front_ok: r.frontOk,
    met_manager: r.metManager,
    full_talk: r.fullTalk,
    prospect: r.prospect,
    appointment: r.appointment,
    verbal_ok: r.verbalOk,
    won: r.won,
    quick_memo: r.quickMemo,
    negotiation_memo: r.negotiationMemo,
    transcription_text: r.transcriptionText,
    updated_at: new Date().toISOString(),
  };
}

export function mapTarget(row: any): SalesTarget {
  return {
    id: row.id,
    periodType: row.period_type,
    periodKey: row.period_key,
    memberId: row.member_id,
    visitsTarget: row.visits_target ?? 0,
    frontOkTarget: row.front_ok_target ?? 0,
    metManagerTarget: row.met_manager_target ?? 0,
    fullTalkTarget: row.full_talk_target ?? 0,
    prospectTarget: row.prospect_target ?? 0,
    appointmentTarget: row.appointment_target ?? 0,
    verbalOkTarget: row.verbal_ok_target ?? 0,
    wonTarget: row.won_target ?? 0,
    updatedAt: row.updated_at,
  };
}

export function targetToRow(t: Partial<SalesTarget>): Record<string, unknown> {
  return {
    period_type: t.periodType,
    period_key: t.periodKey,
    member_id: t.memberId,
    visits_target: t.visitsTarget,
    front_ok_target: t.frontOkTarget,
    met_manager_target: t.metManagerTarget,
    full_talk_target: t.fullTalkTarget,
    prospect_target: t.prospectTarget,
    appointment_target: t.appointmentTarget,
    verbal_ok_target: t.verbalOkTarget,
    won_target: t.wonTarget,
    updated_at: new Date().toISOString(),
  };
}

export function mapKnowledge(row: any): KnowledgeItem {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    targetArea: row.target_area ?? '',
    storeType: row.store_type ?? '',
    objection: row.objection ?? '',
    rebuttal: row.rebuttal ?? '',
    successTalk: row.success_talk ?? '',
    ngTalk: row.ng_talk ?? '',
    usageScene: row.usage_scene ?? '',
    importance: row.importance ?? '中',
    tags: row.tags ?? [],
    registrantId: row.registrant_id as SalesMemberId,
    memo: row.memo ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function knowledgeToRow(k: Partial<KnowledgeItem>): Record<string, unknown> {
  return {
    title: k.title,
    category: k.category,
    target_area: k.targetArea,
    store_type: k.storeType,
    objection: k.objection,
    rebuttal: k.rebuttal,
    success_talk: k.successTalk,
    ng_talk: k.ngTalk,
    usage_scene: k.usageScene,
    importance: k.importance,
    tags: k.tags,
    registrant_id: k.registrantId,
    memo: k.memo,
    updated_at: new Date().toISOString(),
  };
}
