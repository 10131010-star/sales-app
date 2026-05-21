import type { GoalProgress } from '@/lib/kpi/goals';

export function KpiProgressCard({ goals, compact }: { goals: GoalProgress[]; compact?: boolean }) {
  const show = compact ? goals.filter((g) => g.target > 0).slice(0, 4) : goals.filter((g) => g.target > 0);
  if (show.length === 0) return <p className="text-sm text-slate-500">目標が未設定です</p>;

  return (
    <div className="space-y-3">
      {show.map((g) => (
        <div key={g.metric}>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-slate-700">{g.label}</span>
            <span className={g.rate >= 100 ? 'text-emerald-600 font-bold' : 'text-slate-600'}>
              {g.actual}/{g.target} ({Math.round(g.rate)}%)
            </span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${g.rate >= 100 ? 'bg-emerald-500' : 'bg-violet-500'}`}
              style={{ width: `${Math.min(100, g.rate)}%` }}
            />
          </div>
          {g.remaining > 0 && <p className="text-xs text-slate-500 mt-0.5">残り {g.remaining} 件</p>}
        </div>
      ))}
    </div>
  );
}
