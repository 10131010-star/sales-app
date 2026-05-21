import type {
  AdoptionStatus,
  KnowledgeCategory,
  MemberId,
  PeriodType,
  Priority,
  SalesMemberId,
} from './constants';

export interface Store {
  id: string;
  name: string;
  area: string;
  address: string;
  businessType: string;
  hours: string;
  phone: string;
  instagramUrl: string;
  googleMapUrl: string;
  reviewSiteUrl: string;
  assigneeId: SalesMemberId;
  adoptionStatus: AdoptionStatus;
  priority: Priority;
  salesMemo: string;
  rejectionReason: string;
  nextAction: string;
  nextContactDate: string | null;
  lastContactDate: string | null;
  /** 将来: 営業録音の文字起こし */
  transcriptionText: string;
  /** 将来: AI要約用の生メモ */
  aiMemoRaw: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesRecord {
  id: string;
  recordDate: string;
  memberId: SalesMemberId;
  storeId: string | null;
  area: string;
  visits: number;
  frontOk: number;
  metManager: number;
  fullTalk: number;
  prospect: number;
  appointment: number;
  verbalOk: number;
  won: number;
  quickMemo: string;
  negotiationMemo: string;
  transcriptionText: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesTarget {
  id: string;
  periodType: PeriodType;
  periodKey: string;
  memberId: MemberId;
  visitsTarget: number;
  frontOkTarget: number;
  metManagerTarget: number;
  fullTalkTarget: number;
  prospectTarget: number;
  appointmentTarget: number;
  verbalOkTarget: number;
  wonTarget: number;
  updatedAt: string;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  category: KnowledgeCategory;
  targetArea: string;
  storeType: string;
  objection: string;
  rebuttal: string;
  successTalk: string;
  ngTalk: string;
  usageScene: string;
  importance: string;
  tags: string[];
  registrantId: SalesMemberId;
  memo: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppData {
  stores: Store[];
  salesRecords: SalesRecord[];
  salesTargets: SalesTarget[];
  knowledgeItems: KnowledgeItem[];
}

export interface KpiCounts {
  visits: number;
  frontOk: number;
  metManager: number;
  fullTalk: number;
  prospect: number;
  appointment: number;
  verbalOk: number;
  won: number;
}

export interface ConversionRates {
  frontBreakthrough: number;
  metManager: number;
  fullTalk: number;
  prospect: number;
  appointment: number;
  verbalOk: number;
  finalWin: number;
}

export interface ConversionRateMeta {
  key: keyof ConversionRates;
  label: string;
  hint: string;
  numerator: keyof KpiCounts;
  denominator: keyof KpiCounts;
}
