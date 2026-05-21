import type { ConversionRates, KpiCounts } from '@/data/types';
import { CONVERSION_META, formatPct, safeRate } from './calculations';

export interface Bottleneck {
  id: string;
  title: string;
  message: string;
  hint: string;
  severity: 'high' | 'medium';
}

const HINTS: Record<string, string> = {
  frontBreakthrough: '受付で説明しすぎず、担当者確認を先に取りにいく',
  metManager: '「担当の方はいらっしゃいますか？」を短く伝え、待ち時間を作らない',
  fullTalk: '冒頭でメリットを伝える前に、現在の集客状況を質問する',
  prospect: '導入メリットではなく、売上機会損失に話を寄せる',
  appointment: '次の打ち合わせ日時を具体的に提案し、選択肢を2つに絞る',
  verbalOk: '内諾の条件を明確にし、本部確認用資料をその場で渡す',
  finalWin: '失注理由を記録し、再アプローチ日をカレンダーに入れる',
};

const THRESHOLDS: Record<string, number> = {
  frontBreakthrough: 0.5,
  metManager: 0.6,
  fullTalk: 0.55,
  prospect: 0.4,
  appointment: 0.5,
  verbalOk: 0.45,
  finalWin: 0.08,
};

export function detectBottlenecks(counts: KpiCounts, rates: ConversionRates): Bottleneck[] {
  const results: Bottleneck[] = [];

  if (counts.visits >= 3 && rates.frontBreakthrough < THRESHOLDS.frontBreakthrough) {
    results.push({
      id: 'low-front',
      title: 'フロント突破率が低い',
      message: `訪問数は${counts.visits}件あるが、フロント突破率は${formatPct(rates.frontBreakthrough)}`,
      hint: HINTS.frontBreakthrough,
      severity: 'high',
    });
  }

  if (counts.frontOk >= 2 && rates.metManager < THRESHOLDS.metManager) {
    results.push({
      id: 'low-met',
      title: '担当者対面率が低い',
      message: `フロントOK${counts.frontOk}件に対し、担当者対面率${formatPct(rates.metManager)}`,
      hint: HINTS.metManager,
      severity: 'high',
    });
  }

  if (counts.metManager >= 2 && rates.fullTalk < THRESHOLDS.fullTalk) {
    results.push({
      id: 'low-talk',
      title: 'フルトーク率が低い',
      message: `担当者対面はできているが、フルトーク率${formatPct(rates.fullTalk)}`,
      hint: HINTS.fullTalk,
      severity: 'high',
    });
  }

  if (counts.fullTalk >= 2 && rates.prospect < THRESHOLDS.prospect) {
    results.push({
      id: 'low-prospect',
      title: '見込み化率が低い',
      message: `フルトーク${counts.fullTalk}件あるが、見込み化率${formatPct(rates.prospect)}`,
      hint: HINTS.prospect,
      severity: 'high',
    });
  }

  if (counts.prospect >= 2 && rates.appointment < THRESHOLDS.appointment) {
    results.push({
      id: 'low-apo',
      title: 'アポ化率が低い',
      message: `見込み${counts.prospect}件あるが、アポ化率${formatPct(rates.appointment)}`,
      hint: HINTS.appointment,
      severity: 'medium',
    });
  }

  if (counts.appointment >= 1 && rates.verbalOk < THRESHOLDS.verbalOk) {
    results.push({
      id: 'low-verbal',
      title: '内諾率が低い',
      message: `アポ${counts.appointment}件に対し、内諾率${formatPct(rates.verbalOk)}`,
      hint: HINTS.verbalOk,
      severity: 'medium',
    });
  }

  return results.slice(0, 3);
}

/** ステップ間の落ち込みを検出 */
export function detectStepDrop(counts: KpiCounts): Bottleneck | null {
  const steps = [
    { label: '訪問→フロント', num: counts.frontOk, den: counts.visits },
    { label: 'フロント→対面', num: counts.metManager, den: counts.frontOk },
    { label: '対面→フルトーク', num: counts.fullTalk, den: counts.metManager },
    { label: 'フルトーク→見込み', num: counts.prospect, den: counts.fullTalk },
    { label: '見込み→アポ', num: counts.appointment, den: counts.prospect },
  ];
  let worst: { label: string; rate: number } | null = null;
  for (const s of steps) {
    const rate = safeRate(s.num, s.den);
    if (s.den >= 2 && (!worst || rate < worst.rate)) {
      worst = { label: s.label, rate };
    }
  }
  if (!worst || worst.rate >= 0.4) return null;
  const meta = CONVERSION_META.find((m) => m.label.includes(worst!.label.split('→')[1]?.trim() ?? ''));
  return {
    id: 'step-drop',
    title: `${worst.label}で落ちている`,
    message: `このステップの通過率は${formatPct(worst.rate)}です`,
    hint: meta ? HINTS[meta.key] : '前のステップの成功パターンをナレッジで確認する',
    severity: 'medium',
  };
}
