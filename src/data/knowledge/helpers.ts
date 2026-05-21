import type { KnowledgeCategory } from '@/data/constants';
import type { KnowledgeItem } from '@/data/types';

export type KnowledgeSeedEntry = Omit<KnowledgeItem, 'createdAt' | 'updatedAt'>;

export function dialogue(lines: { role: '営業' | '店舗'; text: string }[]): string {
  return lines.map((l) => `${l.role}：\n「${l.text}」`).join('\n\n');
}

type ItemFields = Omit<
  KnowledgeSeedEntry,
  'id' | 'category' | 'title' | 'favorite' | 'createdBy' | 'viewCount' | 'useCount'
>;

export function item(
  id: string,
  category: KnowledgeCategory,
  title: string,
  fields: ItemFields,
): KnowledgeSeedEntry {
  return {
    id,
    category,
    title,
    favorite: false,
    createdBy: 'system',
    viewCount: 0,
    useCount: 0,
    ...fields,
  };
}

export function knowledgeDedupeKey(category: string, title: string): string {
  return `${category}::${title.trim()}`;
}
