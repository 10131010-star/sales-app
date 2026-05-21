import type { KnowledgeItem } from './types';
import { uid } from '@/lib/utils';

const now = new Date().toISOString();

const REBUTTALS: { objection: string; rebuttal: string }[] = [
  {
    objection: 'Uberは利益が出ない',
    rebuttal:
      '利益が残らない原因は、導入そのものより価格設定や商品設計にあるケースが多いです。最初から利益が残るメニュー設計まで考えることで改善できます。',
  },
  {
    objection: '常連メインだから不要',
    rebuttal:
      '常連のお客様が来店できない日でも注文できる導線を作れるので、既存客の接点を増やす使い方もできます。',
  },
  {
    objection: '人手が足りない',
    rebuttal: '忙しいピーク時ではなく、アイドル時間の売上を作る目的で始める店舗もあります。',
  },
  {
    objection: '前にやって失敗した',
    rebuttal:
      '失敗した店舗は、写真・価格・メニュー構成・導線設計が弱かったケースが多いです。今回は運用面まで見直せます。',
  },
  {
    objection: '今忙しい',
    rebuttal: '今すぐ導入の話ではなく、近隣店舗の動きと売上機会だけ簡単に共有させてください。',
  },
  {
    objection: '本部に確認しないといけない',
    rebuttal: '本部確認用に、導入メリットと費用感が分かる情報だけ整理してお渡しできます。',
  },
  {
    objection: '手数料が高い',
    rebuttal:
      '手数料だけを見ると高く感じますが、新規集客費や広告費として見ると比較しやすいです。利益が残る商品だけ出す設計も可能です。',
  },
  {
    objection: 'うちはテイクアウトだけで十分',
    rebuttal: 'テイクアウトは来店圏内のお客様が中心ですが、デリバリーは来店しづらい距離のお客様にも届けられます。',
  },
  {
    objection: '口コミが悪くなりそう',
    rebuttal: '配送品質に不安がある場合は、崩れにくい商品だけ掲載する形で始めることもできます。',
  },
  {
    objection: 'メニュー写真がない',
    rebuttal: '最初は主力商品だけでも掲載できます。写真の見せ方で注文率が変わるので、売れ筋から整えるのが良いです。',
  },
];

export function buildKnowledgeSeed(): KnowledgeItem[] {
  return REBUTTALS.map((r, i) => ({
    id: uid(),
    title: r.objection,
    category: '切り返し' as const,
    targetArea: '',
    storeType: '',
    objection: r.objection,
    rebuttal: r.rebuttal,
    successTalk: '',
    ngTalk: '',
    usageScene: '店舗訪問・フルトーク時',
    importance: i < 3 ? '高' : '中',
    tags: ['切り返し', 'よくある断り'],
    registrantId: i % 2 === 0 ? 'nakata' : 'mitsuyama',
    memo: '',
    createdAt: now,
    updatedAt: now,
  }));
}
