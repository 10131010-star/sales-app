import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '@/context/DataContext';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { SalesMemberSelector } from '@/components/MemberSelector';
import { KpiProgressCard } from '@/components/KpiProgressCard';
import { ConversionRatesCard } from '@/components/ConversionRatesCard';
import { aggregateRecords, calcConversionRates, formatPct } from '@/lib/kpi/calculations';
import { detectBottlenecks, detectStepDrop } from '@/lib/kpi/bottleneck';
import { filterRecordsByPeriod, periodKey, periodLabel } from '@/lib/kpi/periods';
import { buildGoalProgress, getTargetForMember } from '@/lib/kpi/goals';
import { KPI_LABELS, type PeriodType } from '@/data/constants';
import { todayStr } from '@/lib/utils';
import { memberName } from '@/data/constants';

export function HomePage() {
  const { data, currentMemberId, recordsFor } = useData();
  const [period, setPeriod] = useState<PeriodType>('day');

  const records = recordsFor(currentMemberId);
  const periodRecords = filterRecordsByPeriod(records, period);
  const counts = aggregateRecords(periodRecords);
  const rates = calcConversionRates(counts);
  const pk = periodKey(period);
  const target = getTargetForMember(data.salesTargets, pk, period, currentMemberId);
  const goals = buildGoalProgress(counts, target);

  const bottlenecks = useMemo(() => {
    const list = detectBottlenecks(counts, rates);
    const step = detectStepDrop(counts);
    if (step) list.push(step);
    return list;
  }, [counts, rates]);

  const todayStores = data.stores.filter(
    (s) => s.assigneeId === currentMemberId && s.nextContactDate === todayStr(),
  );

  return (
    <div className="space-y-5 pb-4">
      <header>
        <p className="text-sm text-violet-600 font-semibold">営業ダッシュボード</p>
        <h1 className="text-2xl font-bold text-slate-900 mt-0.5">ホーム</h1>
        <p className="text-sm text-slate-500">{periodLabel(period)} · {memberName(currentMemberId)}</p>
      </header>

      <Card className="bg-gradient-to-br from-violet-600 to-violet-800 text-white border-0">
        <p className="text-sm opacity-90">担当者</p>
        <div className="mt-2">
          <SalesMemberSelector />
        </div>
      </Card>

      <div className="flex gap-2">
        {(['day', 'week', 'month'] as PeriodType[]).map((p) => (
          <Chip key={p} label={p === 'day' ? '今日' : p === 'week' ? '今週' : '今月'} active={period === p} onClick={() => setPeriod(p)} />
        ))}
      </div>

      <Card accent="#7c3aed">
        <h2 className="font-bold text-slate-900 mb-3">KPI（{period === 'day' ? '今日' : period === 'week' ? '今週' : '今月'}）</h2>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {(Object.keys(KPI_LABELS) as (keyof typeof KPI_LABELS)[]).map((k) => (
            <div key={k} className="text-center">
              <p className="text-2xl font-bold text-violet-700">{counts[k]}</p>
              <p className="text-[10px] text-slate-500 leading-tight">{KPI_LABELS[k]}</p>
            </div>
          ))}
        </div>
        <p className="text-sm font-semibold text-slate-700 mb-2">目標進捗</p>
        <KpiProgressCard goals={goals} compact />
      </Card>

      <Card>
        <h2 className="font-bold text-slate-900 mb-2">今日のボトルネック</h2>
        {bottlenecks.length === 0 ? (
          <p className="text-sm text-emerald-600">大きな詰まりは検出されていません 👍</p>
        ) : (
          <div className="space-y-3">
            {bottlenecks.map((b) => (
              <div key={b.id} className={`rounded-xl p-3 ${b.severity === 'high' ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50'}`}>
                <p className="font-semibold text-slate-900">{b.title}</p>
                <p className="text-sm text-slate-600 mt-1">{b.message}</p>
                <p className="text-sm text-violet-700 mt-2">💡 {b.hint}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <details>
          <summary className="font-bold text-slate-900 cursor-pointer">転換率の詳細</summary>
          <div className="mt-3">
            <ConversionRatesCard counts={counts} />
          </div>
        </details>
        <p className="text-sm mt-3 text-slate-600">
          最終獲得率: <strong className="text-violet-700">{formatPct(rates.finalWin)}</strong>
        </p>
      </Card>

      <Link to="/store-analysis">
        <Card accent="#6366f1" className="bg-gradient-to-r from-indigo-50 to-violet-50">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📊</span>
            <div>
              <h2 className="font-bold text-slate-900">店舗分析AI</h2>
              <p className="text-sm text-slate-600 mt-0.5">上位店比較ベースの導入レポート（新規）</p>
            </div>
          </div>
        </Card>
      </Link>

      <Card accent="#0d9488">
        <h2 className="font-bold text-slate-900 mb-2">今日やること</h2>
        {todayStores.length === 0 ? (
          <p className="text-sm text-slate-500">次回接触予定の店舗はありません</p>
        ) : (
          <ul className="space-y-2">
            {todayStores.map((s) => (
              <li key={s.id}>
                <Link to={`/stores/${s.id}`} className="text-violet-700 font-medium">
                  {s.name}
                </Link>
                {s.nextAction && <p className="text-sm text-slate-500">→ {s.nextAction}</p>}
              </li>
            ))}
          </ul>
        )}
        <Link to="/stores" className="text-sm text-violet-600 mt-2 inline-block">店舗一覧 →</Link>
      </Card>
    </div>
  );
}
