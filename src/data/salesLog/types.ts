import type { SalesMemberId } from '@/data/constants';

/** 商談結果ステータス */
export type SalesLogOutcome =
  | '興味あり'
  | '資料送付'
  | '断り'
  | '導入済み'
  | '保留';

export const SALES_LOG_OUTCOMES: SalesLogOutcome[] = [
  '興味あり',
  '資料送付',
  '断り',
  '導入済み',
  '保留',
];

/** 訪問・商談単位の営業履歴（RAG・現場分析用） */
export interface SalesLog {
  id: string;
  storeId: string | null;
  memberId: SalesMemberId;
  visitedAt: string;
  area: string;
  businessType: string;
  outcome: SalesLogOutcome;
  objectionHeard: string;
  hitProposal: string;
  dislikedPoint: string;
  ownerReaction: string;
  nextAction: string;
  quickMemo: string;
  negotiationMemo: string;
  createdAt: string;
  updatedAt: string;
}

export function salesLogSearchText(log: SalesLog): string {
  return [
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
    .toLowerCase();
}
