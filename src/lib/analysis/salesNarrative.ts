import type { SalesLog } from '@/data/salesLog/types';

/** 店舗の営業履歴から提案型文言を生成 */
export function buildSalesHistoryProposals(logs: SalesLog[]): string[] {
  const storeLogs = logs.slice(0, 5);
  const proposals: string[] = [];

  for (const log of storeLogs) {
    if (log.hitProposal) {
      proposals.push(
        `過去の商談（${log.visitedAt.slice(0, 10)}）では「${log.hitProposal}」が刺さった記録があります。比較上、同様の切り口を今回の提案にも活かす余地があります。`,
      );
    }
    if (log.objectionHeard) {
      proposals.push(
        `以前「${log.objectionHeard}」という断りがありました。上位店傾向から見ると、段階導入・商品限定で懸念を分解する提案が適している可能性があります。`,
      );
    }
    if (log.dislikedPoint) {
      proposals.push(
        `オーナーが嫌がった点として「${log.dislikedPoint}」の記録があります。比較上、この点を避けた運用設計（時間帯・品数）に改善余地があります。`,
      );
    }
    if (log.ownerReaction) {
      proposals.push(
        `商談時の反応: 「${log.ownerReaction}」。口コミ・上位店傾向と合わせて、次回は${log.nextAction || '具体メニュー案の提示'}が有効な可能性があります。`,
      );
    }
  }

  return [...new Set(proposals)].slice(0, 4);
}

export function buildOwnerNarrativeFromSales(logs: SalesLog[], storeName: string): string {
  if (logs.length === 0) return '';
  const latest = logs[0];
  const parts = [
    `「${storeName}」について、過去${logs.length}件の営業履歴を参照しました。`,
    latest.outcome && `直近の商談結果は【${latest.outcome}】です。`,
    latest.hitProposal && `刺さった提案: ${latest.hitProposal}。`,
    latest.objectionHeard && `主な断り: ${latest.objectionHeard}。`,
  ].filter(Boolean);
  return parts.join(' ');
}
