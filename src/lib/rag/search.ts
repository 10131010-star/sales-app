/** 外部APIなしの簡易検索（トークン重複スコア） */

const STOP = new Set(['の', 'に', 'は', 'を', 'た', 'が', 'で', 'て', 'と', 'し', 'れ', 'さ', 'ある', 'いる', 'する', 'など']);

export function tokenize(text: string): string[] {
  const normalized = text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ');
  return normalized
    .split(/\s+/)
    .flatMap((t) => (t.length <= 1 && !/\d/.test(t) ? [] : [t]))
    .filter((t) => t.length >= 2 && !STOP.has(t));
}

export function buildQueryTerms(input: {
  name: string;
  area: string;
  businessType: string;
  avgUnitPrice?: number;
  setRate?: number;
}): string[] {
  const terms = [
    input.area,
    input.businessType,
    input.name,
    'デリバリー',
    'Uber',
    '出前館',
    'セット',
    '深夜',
    '単価',
    '口コミ',
    '導入',
  ];
  return [...new Set(terms.flatMap(tokenize))];
}

export function scoreText(queryTerms: string[], document: string): number {
  if (!document.trim() || queryTerms.length === 0) return 0;
  const docTokens = new Set(tokenize(document));
  let hits = 0;
  for (const q of queryTerms) {
    if (docTokens.has(q)) hits += 1;
    else if (document.includes(q)) hits += 0.7;
  }
  return Math.min(1, hits / Math.max(3, queryTerms.length * 0.5));
}

export function rankDocuments<T>(
  items: T[],
  getSearchable: (item: T) => string,
  queryTerms: string[],
  limit: number,
): { item: T; score: number }[] {
  return items
    .map((item) => ({
      item,
      score: scoreText(queryTerms, getSearchable(item)),
    }))
    .filter((x) => x.score > 0.05)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
