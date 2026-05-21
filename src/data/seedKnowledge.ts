import { ALL_KNOWLEDGE_SEED, knowledgeDedupeKey } from '@/data/knowledge';
import type { KnowledgeItem } from '@/data/types';

const SEED_TIMESTAMP = '2026-05-19T00:00:00.000Z';

/**
 * 依頼文の50件トークを初期データとして返す。
 * id は固定（kv-first-01 等）で再投入時も同一レコードを識別可能。
 */
export function buildKnowledgeSeed(): KnowledgeItem[] {
  return ALL_KNOWLEDGE_SEED.map((entry) => ({
    ...entry,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  }));
}

/** title + category で重複判定（初期投入・マージ用） */
export function isDuplicateKnowledge(
  existing: Pick<KnowledgeItem, 'title' | 'category'>[],
  candidate: Pick<KnowledgeItem, 'title' | 'category'>,
): boolean {
  const key = knowledgeDedupeKey(candidate.category, candidate.title);
  return existing.some((e) => knowledgeDedupeKey(e.category, e.title) === key);
}

/** 既存に無い seed のみ返す */
export function filterNewKnowledgeItems(
  existing: KnowledgeItem[],
  seeds: KnowledgeItem[],
): KnowledgeItem[] {
  return seeds.filter((s) => !isDuplicateKnowledge(existing, s));
}

export const KNOWLEDGE_SEED_COUNT = ALL_KNOWLEDGE_SEED.length;
