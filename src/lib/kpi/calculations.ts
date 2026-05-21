import type { ConversionRates, KpiCounts, SalesRecord } from '@/data/types';

export const CONVERSION_META = [
  {
    key: 'frontBreakthrough' as const,
    label: 'フロント突破率',
    hint: '訪問数に対してフロントを突破できた割合',
    numerator: 'frontOk' as const,
    denominator: 'visits' as const,
  },
  {
    key: 'metManager' as const,
    label: '担当者対面率',
    hint: 'フロントOKに対して担当者と対面できた割合',
    numerator: 'metManager' as const,
    denominator: 'frontOk' as const,
  },
  {
    key: 'fullTalk' as const,
    label: 'フルトーク率',
    hint: '担当者対面に対してフルトークまで進んだ割合',
    numerator: 'fullTalk' as const,
    denominator: 'metManager' as const,
  },
  {
    key: 'prospect' as const,
    label: '見込み化率',
    hint: 'フルトークに対して見込み化できた割合',
    numerator: 'prospect' as const,
    denominator: 'fullTalk' as const,
  },
  {
    key: 'appointment' as const,
    label: 'アポ化率',
    hint: '見込みに対してアポ化できた割合',
    numerator: 'appointment' as const,
    denominator: 'prospect' as const,
  },
  {
    key: 'verbalOk' as const,
    label: '内諾率',
    hint: 'アポに対して内諾を得られた割合',
    numerator: 'verbalOk' as const,
    denominator: 'appointment' as const,
  },
  {
    key: 'finalWin' as const,
    label: '最終獲得率',
    hint: '訪問数に対して獲得に至った割合',
    numerator: 'won' as const,
    denominator: 'visits' as const,
  },
];

export function safeRate(num: number, den: number): number {
  if (!den || den <= 0) return 0;
  return num / den;
}

export function formatPct(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

export function aggregateRecords(records: SalesRecord[]): KpiCounts {
  return records.reduce<KpiCounts>(
    (acc, r) => ({
      visits: acc.visits + r.visits,
      frontOk: acc.frontOk + r.frontOk,
      metManager: acc.metManager + r.metManager,
      fullTalk: acc.fullTalk + r.fullTalk,
      prospect: acc.prospect + r.prospect,
      appointment: acc.appointment + r.appointment,
      verbalOk: acc.verbalOk + r.verbalOk,
      won: acc.won + r.won,
    }),
    { visits: 0, frontOk: 0, metManager: 0, fullTalk: 0, prospect: 0, appointment: 0, verbalOk: 0, won: 0 },
  );
}

export function calcConversionRates(counts: KpiCounts): ConversionRates {
  return {
    frontBreakthrough: safeRate(counts.frontOk, counts.visits),
    metManager: safeRate(counts.metManager, counts.frontOk),
    fullTalk: safeRate(counts.fullTalk, counts.metManager),
    prospect: safeRate(counts.prospect, counts.fullTalk),
    appointment: safeRate(counts.appointment, counts.prospect),
    verbalOk: safeRate(counts.verbalOk, counts.appointment),
    finalWin: safeRate(counts.won, counts.visits),
  };
}
