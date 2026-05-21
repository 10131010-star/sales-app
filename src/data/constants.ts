/** 営業担当（2名 + チーム集計） */
export const MEMBERS = [
  { id: 'nakata', name: '中田大翔', color: '#7c3aed' },
  { id: 'mitsuyama', name: '密山敦也', color: '#db2777' },
  { id: 'team', name: 'チーム全体', color: '#0d9488' },
] as const;

export type MemberId = (typeof MEMBERS)[number]['id'];

export const SALES_MEMBER_IDS = ['nakata', 'mitsuyama'] as const;
export type SalesMemberId = (typeof SALES_MEMBER_IDS)[number];

export const OSAKA_AREAS = [
  '梅田', '難波', '心斎橋', '天王寺', '上本町', '日本橋', '京橋', '堀江', '福島', '十三',
  '江坂', '新大阪', '本町', '北浜', '谷町四丁目', '堺筋本町', '阿倍野', '西中島南方',
] as const;

export const STORE_TYPES = [
  'ラーメン', '居酒屋', 'カフェ', '焼肉', '韓国料理', 'バー', '寿司', '中華',
  'イタリアン', '和食', '弁当', '唐揚げ', 'カレー', '個人店', 'チェーン店',
] as const;

export const ADOPTION_STATUSES = [
  '未接触', '受付突破', '担当者接触済み', '見込み', 'アポ予定', '内諾', '獲得', '失注', '再アプローチ予定',
] as const;

export type AdoptionStatus = (typeof ADOPTION_STATUSES)[number];

export const PRIORITIES = ['高', '中', '低'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const KNOWLEDGE_CATEGORIES = [
  '成功事例', '失敗事例', '切り返し', '受付突破', '競合対策', 'クロージング',
  '再アプローチ', '利益改善事例', '繁盛店分析', '店舗タイプ別攻略', 'エリア攻略', 'NGトーク',
] as const;

export type KnowledgeCategory = (typeof KNOWLEDGE_CATEGORIES)[number];

export const IMPORTANCE_LEVELS = ['高', '中', '低'] as const;

export const KPI_METRICS = [
  'visits', 'frontOk', 'metManager', 'fullTalk', 'prospect', 'appointment', 'verbalOk', 'won',
] as const;

export const KPI_LABELS: Record<(typeof KPI_METRICS)[number], string> = {
  visits: '訪問数',
  frontOk: 'フロントOK',
  metManager: '担当者対面',
  fullTalk: 'フルトーク',
  prospect: '見込み',
  appointment: 'アポ',
  verbalOk: '内諾',
  won: '獲得',
};

export const PERIOD_TYPES = ['day', 'week', 'month'] as const;
export type PeriodType = (typeof PERIOD_TYPES)[number];

export const PERIOD_LABELS: Record<PeriodType, string> = {
  day: '今日',
  week: '今週',
  month: '今月',
};

export function memberName(id: string): string {
  return MEMBERS.find((m) => m.id === id)?.name ?? id;
}
