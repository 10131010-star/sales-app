import { useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { Card } from '@/components/ui/Card';
import { MEMBERS, memberName } from '@/data/constants';
import { aggregateRecords, calcConversionRates, formatPct } from '@/lib/kpi/calculations';
import { filterRecordsByPeriod, periodKey } from '@/lib/kpi/periods';
import { monthAchievementRate, getTargetForMember } from '@/lib/kpi/goals';
import { KPI_LABELS } from '@/data/constants';

export function ComparePage() {
  const { data } = useData();
  const monthKey = periodKey('month');
  const monthRecords = filterRecordsByPeriod(data.salesRecords, 'month');

  const memberStats = useMemo(() => {
    return MEMBERS.map((m) => {
      const recs = m.id === 'team' ? monthRecords : monthRecords.filter((r) => r.memberId === m.id);
      const counts = aggregateRecords(recs);
      const rates = calcConversionRates(counts);
      const target = getTargetForMember(data.salesTargets, monthKey, 'month', m.id);
      const achievement = monthAchievementRate(counts, target);
      return { member: m, counts, rates, achievement, target };
    });
  }, [data.salesTargets, monthRecords, monthKey]);

  const visitRank = [...memberStats]
    .filter((s) => s.member.id !== 'team')
    .sort((a, b) => b.counts.visits - a.counts.visits);
  const wonRank = [...visitRank].sort((a, b) => b.counts.won - a.counts.won);
  const rateRank = [...visitRank].sort((a, b) => b.rates.finalWin - a.rates.finalWin);

  return (
    <div className="space-y-5 pb-4">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">比較</h1>
        <p className="text-sm text-slate-500">中田大翔 · 密山敦也 · チーム全体</p>
      </header>

      {memberStats.map(({ member, counts, rates, achievement }) => (
        <Card key={member.id} accent={member.color}>
          <h2 className="text-lg font-bold" style={{ color: member.color }}>{member.name}</h2>
          <p className="text-sm text-slate-500 mt-1">今月の実績</p>
          <div className="grid grid-cols-4 gap-2 mt-3">
            {(['visits', 'frontOk', 'won'] as const).map((k) => (
              <div key={k} className="text-center bg-slate-50 rounded-lg py-2">
                <p className="text-xl font-bold">{counts[k]}</p>
                <p className="text-[10px] text-slate-500">{KPI_LABELS[k]}</p>
              </div>
            ))}
            <div className="text-center bg-slate-50 rounded-lg py-2">
              <p className="text-xl font-bold text-violet-700">{formatPct(rates.finalWin)}</p>
              <p className="text-[10px] text-slate-500">最終獲得率</p>
            </div>
          </div>
          <p className={`text-sm mt-3 font-semibold ${achievement >= 100 ? 'text-emerald-600' : 'text-slate-600'}`}>
            今月達成率（訪問）: {Math.round(achievement)}%
          </p>
        </Card>
      ))}

      <Card>
        <h3 className="font-bold text-slate-900 mb-3">訪問数</h3>
        {visitRank.map((s, i) => (
          <div key={s.member.id} className="flex justify-between py-2 border-b border-slate-50 last:border-0">
            <span>{i + 1}. {memberName(s.member.id)}</span>
            <span className="font-bold">{s.counts.visits}件</span>
          </div>
        ))}
      </Card>

      <Card>
        <h3 className="font-bold text-slate-900 mb-3">獲得数</h3>
        {wonRank.map((s, i) => (
          <div key={s.member.id} className="flex justify-between py-2 border-b border-slate-50 last:border-0">
            <span>{i + 1}. {memberName(s.member.id)}</span>
            <span className="font-bold text-emerald-600">{s.counts.won}件</span>
          </div>
        ))}
      </Card>

      <Card>
        <h3 className="font-bold text-slate-900 mb-3">最終獲得率</h3>
        {rateRank.map((s, i) => (
          <div key={s.member.id} className="flex justify-between py-2 border-b border-slate-50 last:border-0">
            <span>{i + 1}. {memberName(s.member.id)}</span>
            <span className="font-bold text-violet-700">{formatPct(s.rates.finalWin)}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
