import { Link } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { useData } from '@/context/DataContext';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { MemberSelector } from '@/components/MemberSelector';
import { Button } from '@/components/ui/Button';
import { aggregateVisits, formatRate } from '@/lib/kpi/calculations';
import { todayStr } from '@/lib/utils';

const quickLinks = [
  { to: '/analysis', label: '分析ダッシュボード', icon: '📈', color: '#8b5cf6' },
  { to: '/kpi', label: 'KPI・日報', icon: '🎯', color: '#06b6d4' },
  { to: '/campaigns', label: 'キャンペーン', icon: '🎁', color: '#f59e0b' },
];

export function HomePage() {
  const { data, currentMemberId, organizeTomorrowActions } = useData();
  const today = todayStr();
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());

  const memberVisits = data.visits.filter(
    (v) =>
      v.memberId === currentMemberId &&
      isWithinInterval(parseISO(v.visitedAt), { start: monthStart, end: monthEnd }),
  );
  const kpi = aggregateVisits(memberVisits);

  const todayTodos = data.todos.filter((t) => t.dueDate === today && !t.completed);
  const focusAreas = [...data.focusAreas].sort((a, b) => a.priority - b.priority);
  const notAdoptedCount = data.stores.filter((s) => s.notAdoptedServices.length > 0).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="営業ダッシュボード"
        subtitle={format(new Date(), 'M月d日')}
      />

      <Card className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white border-0">
        <p className="text-sm opacity-90">ログイン中</p>
        <div className="mt-2">
          <MemberSelector />
        </div>
      </Card>

      <section>
        <h2 className="mb-2 text-sm font-bold text-slate-700">今月のKPI（{data.members.find((m) => m.id === currentMemberId)?.name}）</h2>
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="訪問数" value={kpi.visits} color="#6366f1" />
          <StatCard label="獲得" value={kpi.won} sub={`成約率 ${formatRate(kpi.wonRate)}`} color="#10b981" />
          <StatCard label="見込み" value={kpi.prospect} sub={`転換 ${formatRate(kpi.prospectRate)}`} color="#f59e0b" />
          <StatCard label="FTR" value={kpi.ftr} sub={`FTR率 ${formatRate(kpi.ftrRate)}`} color="#ec4899" />
        </div>
        <Link to="/kpi" className="mt-2 block text-center text-sm text-indigo-600 font-medium">
          詳細KPIを見る →
        </Link>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-700">今日やること ({todayTodos.length})</h2>
          <Link to="/sales" className="text-sm text-indigo-600">+追加</Link>
        </div>
        {todayTodos.length === 0 ? (
          <Card><p className="text-slate-500 text-sm">今日のタスクはありません 🎉</p></Card>
        ) : (
          <div className="space-y-2">
            {todayTodos.map((t) => (
              <Card key={t.id} accent="#6366f1">
                <p className="font-medium text-slate-800">{t.title}</p>
                {t.storeId && (
                  <Link to={`/stores/${t.storeId}`} className="text-xs text-indigo-600 mt-1 inline-block">
                    店舗カルテを開く
                  </Link>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold text-slate-700">重点訪問エリア</h2>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {focusAreas.map((fa) => (
            <Card key={fa.id} className="min-w-[140px] shrink-0" accent="#8b5cf6">
              <p className="font-bold text-slate-800">{fa.name}</p>
              <p className="text-xs text-slate-500 mt-1">{fa.notes}</p>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold text-slate-700">クイックアクセス</h2>
        <div className="grid grid-cols-1 gap-2">
          {quickLinks.map((l) => (
            <Link key={l.to} to={l.to}>
              <Card accent={l.color} className="flex items-center gap-3">
                <span className="text-2xl">{l.icon}</span>
                <span className="font-semibold text-slate-800">{l.label}</span>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <Card>
        <p className="text-sm text-slate-600">未導入店舗候補: <strong>{notAdoptedCount}</strong> 件</p>
        <Link to="/stores?filter=not_adopted" className="text-sm text-indigo-600 font-medium mt-1 inline-block">
          一覧を見る →
        </Link>
      </Card>

      <Button fullWidth variant="secondary" onClick={() => void organizeTomorrowActions()}>
        📅 明日のアクションを自動整理
      </Button>
    </div>
  );
}
