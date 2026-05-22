import { ALL_KNOWLEDGE_SEED } from '@/data/knowledge';
import type { KnowledgeItem } from '@/data/types';
import type { RagObjectionRef } from '@/data/rag/types';
import { rankDocuments, scoreText } from '@/lib/rag/search';

/** 断り文句キーワード → 成功事例からの改善提案テンプレ */
const OBJECTION_SUGGESTIONS: { keywords: string[]; suggestions: string[] }[] = [
  {
    keywords: ['忙しく', '忙しい', '手が回ら', '人手', '人が足り'],
    suggestions: ['昼帯のみ導入', '商品数限定（人気5品）', '15〜17時のアイドル時間のみ稼働'],
  },
  {
    keywords: ['手数料', 'コスト', '割高', '儲から', '利益'],
    suggestions: ['セット設計で単価アップ', '人気商品に絞ってテスト', '雨の日・閑散時間のみ稼働'],
  },
  {
    keywords: ['メニュー', '品数', '多すぎ', '全部'],
    suggestions: ['商品数限定で成功', '写真・価格見直しから再開', '店内メニューと別ライン'],
  },
  {
    keywords: ['品質', '伸び', '冷め', 'パック', '汁'],
    suggestions: ['汁分けメニュー', 'デリバリー専用包装', '人気商品のみで品質管理'],
  },
  {
    keywords: ['ピーク', '混む', 'ラッシュ', '満席'],
    suggestions: ['アイドル時間のみ稼働', '昼帯のみ導入', '深夜帯は見送り'],
  },
  {
    keywords: ['写真', '見た目', '安っぽ'],
    suggestions: ['写真・価格見直し', 'スイーツ・セットの見せ方変更', 'デリバリー専用撮影'],
  },
];

export interface ObjectionMatchResult {
  refs: RagObjectionRef[];
  heardObjections: string[];
}

function templateSuggestions(objectionText: string): string[] {
  const found: string[] = [];
  for (const row of OBJECTION_SUGGESTIONS) {
    if (row.keywords.some((k) => objectionText.includes(k))) {
      found.push(...row.suggestions);
    }
  }
  return [...new Set(found)].slice(0, 4);
}

function successCasesFromKnowledge(pool: KnowledgeItem[], queryTerms: string[], limit: number) {
  const cases = pool.filter((k) => k.category === '成功事例');
  return rankDocuments(
    cases,
    (k) => [k.title, k.summary, k.successPoint, k.talkScript, k.tags.join(' ')].join(' '),
    queryTerms,
    limit,
  );
}

/** 断り文句 + 成功事例RAG */
export function matchObjectionsWithSuccessCases(
  queryTerms: string[],
  knowledgePool: KnowledgeItem[],
  heardObjections: string[],
  limit = 5,
): ObjectionMatchResult {
  const pool = [
    ...knowledgePool,
    ...ALL_KNOWLEDGE_SEED.map((s) => ({ ...s, createdAt: '', updatedAt: '' })),
  ];
  const unique = Array.from(new Map(pool.map((k) => [k.id, k])).values());

  const rebuttalItems = unique.filter(
    (k) => k.category === '切り返し' || k.tags.some((t) => t.includes('断り') || t.includes('切り返し')),
  );
  const rankedRebuttals = rankDocuments(
    rebuttalItems,
    (k) => [k.title, k.talkScript, k.ngExample, k.tags.join(' ')].join(' '),
    queryTerms,
    limit,
  );

  const rankedSuccess = successCasesFromKnowledge(unique, queryTerms, limit);
  const refs: RagObjectionRef[] = [];

  for (const heard of heardObjections.filter(Boolean).slice(0, 3)) {
    const suggestions = templateSuggestions(heard);
    const bestSuccess = rankedSuccess.find(({ item }) =>
      scoreText([heard], [item.title, item.summary, item.successPoint].join(' ')) > 0.1,
    );
    refs.push({
      id: `heard-${heard.slice(0, 20)}`,
      objection: heard,
      rebuttalExcerpt: bestSuccess
        ? `成功事例「${bestSuccess.item.title}」: ${bestSuccess.item.successPoint}`
        : rankedRebuttals[0]?.item.summary ?? '',
      relevance: Math.round((bestSuccess?.score ?? 0.5) * 100),
      suggestions:
        suggestions.length > 0
          ? suggestions
          : bestSuccess
            ? [bestSuccess.item.nextAction, bestSuccess.item.successPoint].filter(Boolean)
            : [],
      successCaseTitle: bestSuccess?.item.title,
    });
  }

  for (const { item: k, score } of rankedRebuttals.slice(0, limit)) {
    if (refs.some((r) => r.id === k.id)) continue;
    refs.push({
      id: k.id,
      objection: k.title,
      rebuttalExcerpt: k.talkScript.slice(0, 200),
      relevance: Math.round(score * 100),
      suggestions: templateSuggestions(k.title),
      successCaseTitle: rankedSuccess[0]?.item.title,
    });
  }

  return { refs: refs.slice(0, limit), heardObjections };
}
