export type ServiceId = 'uber_eats' | 'demae_can' | 'menu' | 'rocket_now';

export const SERVICE_LABELS: Record<ServiceId, string> = {
  uber_eats: 'Uber Eats',
  demae_can: '出前館',
  menu: 'menu',
  rocket_now: 'Rocket Now',
};

export const SERVICE_COLORS: Record<ServiceId, string> = {
  uber_eats: 'bg-emerald-500',
  demae_can: 'bg-red-500',
  menu: 'bg-orange-500',
  rocket_now: 'bg-violet-500',
};

export interface PlatformCompare {
  serviceId: ServiceId;
  commissionMin: number;
  commissionMax: number;
  uiScore: number;
  strongAreas: string[];
  weakAreas: string[];
  features: string[];
  notes: string;
  updatedAt: string;
}

export interface Member {
  id: string;
  name: string;
  color: string;
}

export interface StoreCard {
  id: string;
  name: string;
  area: string;
  businessType: string;
  adoptedServices: ServiceId[];
  notAdoptedServices: ServiceId[];
  hours: string;
  priceRange: 'low' | 'mid' | 'high';
  productCount?: number;
  photoStrength: 1 | 2 | 3 | 4 | 5;
  reviewCount?: number;
  rating?: number;
  popularMenus: string[];
  setDesign?: string;
  targetCustomers?: string;
  ownerType?: string;
  benefitHypothesis?: string;
  concerns?: string;
  pitchTalk?: string;
  nextAction?: string;
  priorityArea: boolean;
  prospectLevel: 'none' | 'low' | 'mid' | 'high';
  createdAt: string;
  updatedAt: string;
}

export interface VisitLog {
  id: string;
  storeId: string;
  memberId: string;
  visitedAt: string;
  frontOk: boolean;
  metManager: boolean;
  fullTalk: boolean;
  prospect: boolean;
  appointment: boolean;
  verbalOk: boolean;
  won: boolean;
  quickMemo?: string;
  negotiationMemo?: string;
}

export interface TodoItem {
  id: string;
  title: string;
  storeId?: string;
  memberId: string;
  dueDate: string;
  completed: boolean;
  source: 'manual' | 'next_action' | 'auto_tomorrow';
  createdAt: string;
}

export interface Campaign {
  id: string;
  title: string;
  serviceId: ServiceId;
  startDate: string;
  endDate: string;
  description: string;
  targetAreas: string[];
  active: boolean;
}

export interface SalesScript {
  id: string;
  type: 'talk' | 'objection' | 'rebuttal' | 'hook' | 'success' | 'loss';
  title: string;
  content: string;
  businessTypes: string[];
  tags: string[];
  memberId?: string;
}

export interface WinLossPattern {
  id: string;
  type: 'win' | 'loss';
  title: string;
  situation: string;
  action: string;
  result: string;
  businessType: string;
  memberId: string;
  createdAt: string;
}

export interface DailyReport {
  id: string;
  date: string;
  memberId: string;
  summary: string;
  learnings: string;
  improvementMemo: string;
  tomorrowPlan: string;
  createdAt: string;
}

export interface FocusArea {
  id: string;
  name: string;
  priority: number;
  notes: string;
}

export interface AppData {
  platforms: PlatformCompare[];
  members: Member[];
  stores: StoreCard[];
  visits: VisitLog[];
  todos: TodoItem[];
  campaigns: Campaign[];
  scripts: SalesScript[];
  patterns: WinLossPattern[];
  dailyReports: DailyReport[];
  focusAreas: FocusArea[];
}

export interface KpiSummary {
  visits: number;
  frontOk: number;
  metManager: number;
  fullTalk: number;
  prospect: number;
  appointment: number;
  verbalOk: number;
  won: number;
  ftr: number;
  frontOkRate: number;
  metManagerRate: number;
  fullTalkRate: number;
  prospectRate: number;
  appointmentRate: number;
  verbalOkRate: number;
  wonRate: number;
  ftrRate: number;
}

export const PRICE_LABELS = { low: '〜999円', mid: '1000〜1999円', high: '2000円〜' } as const;
export const BUSINESS_TYPES = ['居酒屋', 'ラーメン', 'カレー', '弁当', '寿司', '焼肉', 'カフェ', '中華', '洋食', 'その他'] as const;
export const AREAS = ['渋谷', '新宿', '池袋', '品川', '横浜', '大宮', '千葉', 'その他'] as const;
export const OWNER_TYPES = ['積極型', '慎重型', '忙しい型', '価格重視', '品質重視'] as const;
