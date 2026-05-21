import { firstVisitTalks } from './firstVisitTalks';
import { objectionTalks } from './objectionTalks';
import { proposalTalks } from './proposalTalks';
import { closingTalks } from './closingTalks';
import { successCases } from './successCases';
import type { KnowledgeSeedEntry } from './helpers';

export { firstVisitTalks, objectionTalks, proposalTalks, closingTalks, successCases };
export type { KnowledgeSeedEntry } from './helpers';
export { dialogue, item, knowledgeDedupeKey } from './helpers';

/** 全カテゴリの初期ナレッジ（計50件） */
export const ALL_KNOWLEDGE_SEED: KnowledgeSeedEntry[] = [
  ...firstVisitTalks,
  ...objectionTalks,
  ...proposalTalks,
  ...closingTalks,
  ...successCases,
];
