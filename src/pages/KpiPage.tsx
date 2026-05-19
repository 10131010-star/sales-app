import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { useData } from '@/context/DataContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';
import { MemberSelector } from '@/components/MemberSelector';
import { aggregateVisits, formatRate } from '@/lib/kpi/calculations';
import { uid, todayStr } from '@/lib/utils';

export function KpiPage() {
  const { data, update, currentMemberId } = useData();
  const [reportSummary, setReportSummary] = useState('');
  const [improvement, setImprovement] = useState('');
  const monthKey = format(new Date(), 'yyyy-MM');
  const monthStart = useMemo(() => startOfMonth(new Date()), [monthKey]);
  const monthEnd = useMemo(() => endOfMonth(new Date()), [monthKey]);

  const memberVisits = useMemo(
    () =>
      data.visits.filter(
        (v) =>
          v.memberId === currentMemberId &&
          isWithinInterval(parseISO(v.visitedAt), { start: monthStart, end: monthEnd }),
      ),
    [data.visits, currentMemberId, monthStart, monthEnd],
  );

  const kpi = aggregateVisits(memberVisits);

  const teamKpi = useMemo(() => {
    return data.members
      .filter((m) => m.id !== 'team')
      .map((m) => {
        const visits = data.visits.filter(
          (v) =>
            v.memberId === m.id &&
            isWithinInterval(parseISO(v.visitedAt), { start: monthStart, end: monthEnd }),
        );
        const agg = aggregateVisits(visits);
        return { member: m, ...agg };
      });
  }, [data.members, data.visits, monthStart, monthEnd]);

  const saveDailyReport = () => {
    void update((prev) => ({
      ...prev,
      dailyReports: [
        {
          id: uid(),
          date: todayStr(),
          memberId: currentMemberId,
          summary: reportSummary,
          learnings: '',
          improvementMemo: improvement,
          tomorrowPlan: '',
          createdAt: new Date().toISOString(),
        },
        ...prev.dailyReports,
      ],
    }));
    setReportSummary('');
    setImprovement('');
  };

  const kpiRows = [
    { label: '訪問数', count: kpi.visits, rate: null },
    { label: 'フロントOK', count: kpi.frontOk, rate: kpi.frontOkRate },
    { label: '担当者対面', count: kpi.metManager, rate: kpi.metManagerRate },
    { label: 'フルトーク', count: kpi.fullTalk, rate: kpi.fullTalkRate },
    { label: '見込み', count: kpi.prospect, rate: kpi.prospectRate },
    { label: 'アポ', count: kpi.appointment, rate: kpi.appointmentRate },
    { label: '内諾', count: kpi.verbalOk, rate: kpi.verbalOkRate },
    { label: '獲得', count: kpi.won, rate: kpi.wonRate },
    { label: 'FTR', count: kpi.ftr, rate: kpi.ftrRate },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="KPI・日報" subtitle={format(new Date(), 'yyyy年M月')} />
      <Link to="/" className="text-sm text-indigo-600">← ホーム</Link>

      <Card>
        <MemberSelector />
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <StatCard label="訪問" value={kpi.visits} color="#6366f1" />
        <StatCard label="獲得" value={kpi.won} sub={formatRate(kpi.wonRate)} color="#10b981" />
      </div>

      <Card>
        <h3 className="font-bold text-slate-800 mb-3">KPI詳細・転換率</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b">
              <th className="py-2">項目</th>
              <th className="py-2 text-right">数</th>
              <th className="py-2 text-right">率</th>
            </tr>
          </thead>
          <tbody>
            {kpiRows.map((row) => (
              <tr key={row.label} className="border-b border-slate-50">
                <td className="py-2.5">{row.label}</td>
                <td className="py-2.5 text-right font-semibold">{row.count}</td>
                <td className="py-2.5 text-right text-indigo-600">
                  {row.rate != null ? formatRate(row.rate) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <h3 className="font-bold text-slate-800 mb-3">チームKPI比較</h3>
        {teamKpi.map((t) => (
          <div key={t.member.id} className="mb-4 last:mb-0">
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold" style={{ color: t.member.color }}>{t.member.name}</span>
              <span className="text-sm text-slate-500">訪問 {t.visits} / 獲得 {t.won}</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, t.visits ? (t.won / t.visits) * 100 * 5 : 0)}%`,
                  backgroundColor: t.member.color,
                }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">成約率 {formatRate(t.wonRate)} · FTR {formatRate(t.ftrRate)}</p>
          </div>
        ))}
      </Card>

      <Card>
        <h3 className="font-bold text-slate-800 mb-3">日報・改善提案メモ</h3>
        <textarea
          placeholder="今日の振り返り..."
          value={reportSummary}
          onChange={(e) => setReportSummary(e.target.value)}
          className="w-full rounded-xl border px-3 py-3 min-h-[80px] text-base mb-2"
        />
        <textarea
          placeholder="改善提案メモ..."
          value={improvement}
          onChange={(e) => setImprovement(e.target.value)}
          className="w-full rounded-xl border px-3 py-3 min-h-[80px] text-base mb-3"
        />
        <Button fullWidth onClick={saveDailyReport}>
          日報を保存
        </Button>
        {data.dailyReports.slice(0, 5).map((r) => (
          <div key={r.id} className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">{r.date}</p>
            <p className="text-sm mt-1">{r.summary || '（内容なし）'}</p>
            {r.improvementMemo && (
              <p className="text-sm text-amber-700 mt-1">💡 {r.improvementMemo}</p>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
}
