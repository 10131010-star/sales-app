import type { KpiCounts, SalesTarget } from '@/data/types';
import { KPI_METRICS, KPI_LABELS, type MemberId } from '@/data/constants';

export interface GoalProgress {
  metric: (typeof KPI_METRICS)[number];
  label: string;
  target: number;
  actual: number;
  rate: number;
  remaining: number;
}

export function getTargetForMember(
  targets: SalesTarget[],
  periodKey: string,
  periodType: SalesTarget['periodType'],
  memberId: MemberId,
): SalesTarget | undefined {
  return targets.find(
    (t) => t.periodKey === periodKey && t.periodType === periodType && t.memberId === memberId,
  );
}

export function buildGoalProgress(counts: KpiCounts, target?: SalesTarget): GoalProgress[] {
  const map: Record<(typeof KPI_METRICS)[number], keyof SalesTarget> = {
    visits: 'visitsTarget',
    frontOk: 'frontOkTarget',
    metManager: 'metManagerTarget',
    fullTalk: 'fullTalkTarget',
    prospect: 'prospectTarget',
    appointment: 'appointmentTarget',
    verbalOk: 'verbalOkTarget',
    won: 'wonTarget',
  };

  return KPI_METRICS.map((metric) => {
    const actual = counts[metric];
    const targetVal = target ? (target[map[metric]] as number) : 0;
    const rate = targetVal > 0 ? (actual / targetVal) * 100 : actual > 0 ? 100 : 0;
    return {
      metric,
      label: KPI_LABELS[metric],
      target: targetVal,
      actual,
      rate,
      remaining: Math.max(0, targetVal - actual),
    };
  });
}

export function monthAchievementRate(counts: KpiCounts, target?: SalesTarget): number {
  if (!target || target.visitsTarget <= 0) return 0;
  return (counts.visits / target.visitsTarget) * 100;
}
