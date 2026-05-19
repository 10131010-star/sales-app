import { useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useData } from '@/context/DataContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { uid, todayStr } from '@/lib/utils';
import type { VisitLog } from '@/data/types';

const KPI_TOGGLES: { key: keyof Pick<VisitLog, 'frontOk' | 'metManager' | 'fullTalk' | 'prospect' | 'appointment' | 'verbalOk' | 'won'>; label: string }[] = [
  { key: 'frontOk', label: 'フロントOK' },
  { key: 'metManager', label: '担当者対面' },
  { key: 'fullTalk', label: 'フルトーク' },
  { key: 'prospect', label: '見込み' },
  { key: 'appointment', label: 'アポ' },
  { key: 'verbalOk', label: '内諾' },
  { key: 'won', label: '獲得' },
];

export function SalesPage() {
  const { data, update, currentMemberId } = useData();
  const [searchParams] = useSearchParams();
  const preStoreId = searchParams.get('store') ?? '';
  const [storeId, setStoreId] = useState(preStoreId || data.stores[0]?.id || '');
  const [quickMemo, setQuickMemo] = useState('');
  const [negotiationMemo, setNegotiationMemo] = useState('');
  type KpiKey = (typeof KPI_TOGGLES)[number]['key'];
  const [flags, setFlags] = useState<Partial<Record<KpiKey, boolean>>>({});

  const store = data.stores.find((s) => s.id === storeId);
  const recentVisits = useMemo(
    () =>
      [...data.visits]
        .filter((v) => v.memberId === currentMemberId)
        .sort((a, b) => b.visitedAt.localeCompare(a.visitedAt))
        .slice(0, 20),
    [data.visits, currentMemberId],
  );

  const saveVisit = () => {
    if (!storeId) return;
    const visit: VisitLog = {
      id: uid(),
      storeId,
      memberId: currentMemberId,
      visitedAt: new Date().toISOString(),
      frontOk: !!flags.frontOk,
      metManager: !!flags.metManager,
      fullTalk: !!flags.fullTalk,
      prospect: !!flags.prospect,
      appointment: !!flags.appointment,
      verbalOk: !!flags.verbalOk,
      won: !!flags.won,
      quickMemo: quickMemo || undefined,
      negotiationMemo: negotiationMemo || undefined,
    };
    void update((prev) => ({ ...prev, visits: [visit, ...prev.visits] }));
    setQuickMemo('');
    setNegotiationMemo('');
    setFlags({});
  };

  const addTodo = () => {
    const title = prompt('今日やることを入力');
    if (!title) return;
    void update((prev) => ({
      ...prev,
      todos: [
        {
          id: uid(),
          title,
          memberId: currentMemberId,
          dueDate: todayStr(),
          completed: false,
          source: 'manual',
          createdAt: new Date().toISOString(),
        },
        ...prev.todos,
      ],
    }));
  };

  const toggleTodo = (id: string) => {
    void update((prev) => ({
      ...prev,
      todos: prev.todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    }));
  };

  return (
    <div className="space-y-4">
      <PageHeader title="営業・訪問" subtitle="クイック入力でその場で記録" />

      <Card className="bg-indigo-50 border-indigo-100">
        <label className="text-sm font-medium text-slate-600">訪問店舗</label>
        <select
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 text-base min-h-[48px]"
        >
          {data.stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}（{s.area}）
            </option>
          ))}
        </select>
        {store && (
          <Link to={`/stores/${store.id}`} className="text-sm text-indigo-600 mt-2 inline-block">
            店舗カルテを見る →
          </Link>
        )}
      </Card>

      <Card>
        <h3 className="font-bold text-slate-800 mb-3">KPIワンタップ</h3>
        <div className="grid grid-cols-2 gap-2">
          {KPI_TOGGLES.map(({ key, label }) => (
            <Chip
              key={key}
              label={flags[key] ? `✓ ${label}` : label}
              active={!!flags[key]}
              onClick={() => setFlags((f) => ({ ...f, [key]: !f[key] }))}
            />
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="font-bold text-slate-800 mb-2">クイックメモ</h3>
        <textarea
          placeholder="訪問中のメモをすぐ入力..."
          value={quickMemo}
          onChange={(e) => setQuickMemo(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-3 min-h-[80px] text-base"
        />
        <h3 className="font-bold text-slate-800 mb-2 mt-3">商談メモ</h3>
        <textarea
          placeholder="商談の詳細..."
          value={negotiationMemo}
          onChange={(e) => setNegotiationMemo(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-3 min-h-[100px] text-base"
        />
        <Button fullWidth size="lg" className="mt-3" onClick={saveVisit}>
          💾 訪問ログを保存
        </Button>
      </Card>

      <section>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-sm font-bold text-slate-700">今日やること</h2>
          <Button size="sm" variant="secondary" onClick={addTodo}>
            + 追加
          </Button>
        </div>
        {data.todos
          .filter((t) => t.dueDate === todayStr() && t.memberId === currentMemberId)
          .map((t) => (
            <Card key={t.id} className="mb-2">
              <button type="button" className="w-full text-left flex gap-3 items-center" onClick={() => toggleTodo(t.id)}>
                <span className={`text-2xl ${t.completed ? 'opacity-40' : ''}`}>{t.completed ? '✅' : '⬜'}</span>
                <span className={t.completed ? 'line-through text-slate-400' : 'font-medium'}>{t.title}</span>
              </button>
            </Card>
          ))}
      </section>

      <section>
        <h2 className="text-sm font-bold text-slate-700 mb-2">最近の訪問ログ</h2>
        {recentVisits.length === 0 ? (
          <Card><p className="text-sm text-slate-500">まだ訪問ログがありません</p></Card>
        ) : (
          recentVisits.map((v) => {
            const s = data.stores.find((st) => st.id === v.storeId);
            return (
              <Card key={v.id} className="mb-2">
                <p className="font-medium">{s?.name ?? '不明'}</p>
                <p className="text-xs text-slate-500">{new Date(v.visitedAt).toLocaleString('ja-JP')}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {v.frontOk && <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">フロントOK</span>}
                  {v.won && <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">獲得</span>}
                  {v.prospect && <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">見込み</span>}
                </div>
                {v.quickMemo && <p className="text-sm mt-2 text-slate-600">{v.quickMemo}</p>}
              </Card>
            );
          })
        )}
      </section>
    </div>
  );
}
