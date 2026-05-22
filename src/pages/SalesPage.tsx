import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '@/context/DataContext';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { SalesMemberSelector } from '@/components/MemberSelector';
import { ConversionRatesCard } from '@/components/ConversionRatesCard';
import { aggregateRecords } from '@/lib/kpi/calculations';
import { filterRecordsByPeriod } from '@/lib/kpi/periods';
import { OSAKA_AREAS, KPI_LABELS, type PeriodType } from '@/data/constants';
import { SALES_LOG_OUTCOMES, type SalesLogOutcome } from '@/data/salesLog/types';
import type { SalesRecord } from '@/data/types';
import { uid, todayStr } from '@/lib/utils';

const KPI_KEYS = ['visits', 'frontOk', 'metManager', 'fullTalk', 'prospect', 'appointment', 'verbalOk', 'won'] as const;

export function SalesPage() {
  const { data, currentMemberId, saveRecord, removeRecord, saveSalesLog, removeSalesLog } = useData();
  const [searchParams] = useSearchParams();
  const preStoreId = searchParams.get('store');
  const [period, setPeriod] = useState<PeriodType>('day');
  const [filterMember, setFilterMember] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [filterDate, setFilterDate] = useState(todayStr());
  const [storeId, setStoreId] = useState(preStoreId ?? '');
  const [area, setArea] = useState('');
  const [counts, setCounts] = useState<Record<string, number>>({
    visits: 1, frontOk: 0, metManager: 0, fullTalk: 0, prospect: 0, appointment: 0, verbalOk: 0, won: 0,
  });
  const [quickMemo, setQuickMemo] = useState('');
  const [negotiationMemo, setNegotiationMemo] = useState('');
  const [transcription, setTranscription] = useState('');
  const [detailOpen, setDetailOpen] = useState(true);
  const [outcome, setOutcome] = useState<SalesLogOutcome>('保留');
  const [objectionHeard, setObjectionHeard] = useState('');
  const [hitProposal, setHitProposal] = useState('');
  const [dislikedPoint, setDislikedPoint] = useState('');
  const [ownerReaction, setOwnerReaction] = useState('');
  const [nextAction, setNextAction] = useState('');

  const recentLogs = (data.salesLogs ?? []).slice(0, 20);

  const periodRecords = useMemo(() => {
    let recs = filterRecordsByPeriod(data.salesRecords, period);
    if (filterMember) recs = recs.filter((r) => r.memberId === filterMember);
    if (filterArea) recs = recs.filter((r) => r.area === filterArea);
    if (period === 'day' && filterDate) recs = recs.filter((r) => r.recordDate === filterDate);
    return recs;
  }, [data.salesRecords, period, filterMember, filterArea, filterDate]);

  const myCounts = aggregateRecords(
    periodRecords.filter((r) => r.memberId === currentMemberId),
  );

  const toggle = (key: string) => {
    setCounts((c) => {
      const next = { ...c, [key]: c[key] >= 1 ? 0 : key === 'visits' ? 1 : 1 };
      if (key !== 'visits' && next[key] === 1) {
        const order = KPI_KEYS;
        const idx = order.indexOf(key as (typeof KPI_KEYS)[number]);
        for (let i = 0; i < idx; i++) {
          const k = order[i];
          if (k === 'visits') next.visits = Math.max(1, next.visits);
          else if (next[k] === 0) next[k] = 1;
        }
      }
      return next;
    });
  };

  const save = async () => {
    const linkedStore = data.stores.find((s) => s.id === storeId);
    const record: SalesRecord = {
      id: uid(),
      recordDate: filterDate,
      memberId: currentMemberId,
      storeId: storeId || null,
      area: area || linkedStore?.area || '',
      visits: counts.visits,
      frontOk: counts.frontOk,
      metManager: counts.metManager,
      fullTalk: counts.fullTalk,
      prospect: counts.prospect,
      appointment: counts.appointment,
      verbalOk: counts.verbalOk,
      won: counts.won,
      quickMemo,
      negotiationMemo,
      transcriptionText: transcription,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveRecord(record);

    const now = new Date().toISOString();
    await saveSalesLog({
      id: uid(),
      storeId: storeId || null,
      memberId: currentMemberId,
      visitedAt: `${filterDate}T12:00:00.000Z`,
      area: area || linkedStore?.area || '',
      businessType: linkedStore?.businessType || '',
      outcome,
      objectionHeard,
      hitProposal,
      dislikedPoint,
      ownerReaction,
      nextAction,
      quickMemo,
      negotiationMemo,
      createdAt: now,
      updatedAt: now,
    });

    setCounts({ visits: 1, frontOk: 0, metManager: 0, fullTalk: 0, prospect: 0, appointment: 0, verbalOk: 0, won: 0 });
    setQuickMemo('');
    setNegotiationMemo('');
    setTranscription('');
    setObjectionHeard('');
    setHitProposal('');
    setDislikedPoint('');
    setOwnerReaction('');
    setNextAction('');
    setOutcome('保留');
  };

  return (
    <div className="space-y-4 pb-4">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">営業</h1>
        <p className="text-sm text-slate-500">日別・週別・月別の実績入力</p>
      </header>

      <Card>
        <p className="text-sm font-medium text-slate-600 mb-2">入力担当者</p>
        <SalesMemberSelector />
      </Card>

      <div className="flex gap-2">
        {(['day', 'week', 'month'] as PeriodType[]).map((p) => (
          <Chip key={p} label={p === 'day' ? '日別' : p === 'week' ? '週別' : '月別'} active={period === p} onClick={() => setPeriod(p)} />
        ))}
      </div>

      <Card>
        <h3 className="font-bold mb-2">フィルタ</h3>
        <label className="block text-sm mb-2">
          日付
          <input type="date" className="w-full mt-1 rounded-xl border px-3 py-3 min-h-[48px]" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
        </label>
        <div className="flex gap-2 flex-wrap mt-2">
          <Chip label="全担当" active={!filterMember} onClick={() => setFilterMember('')} />
          <Chip label="中田" active={filterMember === 'nakata'} onClick={() => setFilterMember('nakata')} />
          <Chip label="密山" active={filterMember === 'mitsuyama'} onClick={() => setFilterMember('mitsuyama')} />
        </div>
        <select className="w-full mt-2 rounded-xl border px-3 py-3 min-h-[48px]" value={filterArea} onChange={(e) => setFilterArea(e.target.value)}>
          <option value="">全エリア</option>
          {OSAKA_AREAS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </Card>

      <Card accent="#7c3aed">
        <h3 className="font-bold text-slate-900 mb-2">実績を追加</h3>
        <label className="block text-sm mb-2">
          エリア
          <select className="w-full mt-1 rounded-xl border px-3 py-3 min-h-[48px]" value={area} onChange={(e) => setArea(e.target.value)}>
            <option value="">店舗から自動</option>
            {OSAKA_AREAS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm mb-2">
          店舗（任意）
          <select className="w-full mt-1 rounded-xl border px-3 py-3 min-h-[48px]" value={storeId} onChange={(e) => setStoreId(e.target.value)}>
            <option value="">— 店舗なし —</option>
            {data.stores.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2 mt-3">
          {KPI_KEYS.map((key) => (
            <Chip
              key={key}
              label={`${counts[key] ? '✓ ' : ''}${KPI_LABELS[key]}`}
              active={counts[key] > 0}
              onClick={() => toggle(key)}
            />
          ))}
        </div>
        <textarea
          className="w-full mt-3 rounded-xl border px-3 py-3 min-h-[72px] text-base"
          placeholder="クイックメモ"
          value={quickMemo}
          onChange={(e) => setQuickMemo(e.target.value)}
        />
        <textarea
          className="w-full mt-2 rounded-xl border px-3 py-3 min-h-[72px] text-base"
          placeholder="商談メモ"
          value={negotiationMemo}
          onChange={(e) => setNegotiationMemo(e.target.value)}
        />
        <textarea
          className="w-full mt-2 rounded-xl border px-3 py-3 min-h-[60px] text-sm"
          placeholder="文字起こし（将来AI用）"
          value={transcription}
          onChange={(e) => setTranscription(e.target.value)}
        />

        <button
          type="button"
          className="w-full flex justify-between items-center mt-4 text-left text-sm font-semibold text-violet-800"
          onClick={() => setDetailOpen(!detailOpen)}
        >
          詳細営業履歴（RAG用）
          <span>{detailOpen ? '▲' : '▼'}</span>
        </button>
        {detailOpen && (
          <div className="mt-2 space-y-3 border-t pt-3">
            <p className="text-xs text-slate-500">商談結果と現場メモは分析AIの根拠になります</p>
            <div className="flex flex-wrap gap-1">
              {SALES_LOG_OUTCOMES.map((o) => (
                <Chip key={o} label={o} active={outcome === o} onClick={() => setOutcome(o)} />
              ))}
            </div>
            <input
              className="w-full rounded-xl border px-3 py-2 text-sm min-h-[44px]"
              placeholder="聞いた断り文句（例: 忙しくなる）"
              value={objectionHeard}
              onChange={(e) => setObjectionHeard(e.target.value)}
            />
            <input
              className="w-full rounded-xl border px-3 py-2 text-sm min-h-[44px]"
              placeholder="刺さった提案"
              value={hitProposal}
              onChange={(e) => setHitProposal(e.target.value)}
            />
            <input
              className="w-full rounded-xl border px-3 py-2 text-sm min-h-[44px]"
              placeholder="嫌がったポイント"
              value={dislikedPoint}
              onChange={(e) => setDislikedPoint(e.target.value)}
            />
            <input
              className="w-full rounded-xl border px-3 py-2 text-sm min-h-[44px]"
              placeholder="オーナー反応"
              value={ownerReaction}
              onChange={(e) => setOwnerReaction(e.target.value)}
            />
            <input
              className="w-full rounded-xl border px-3 py-2 text-sm min-h-[44px]"
              placeholder="次回アクション"
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
            />
          </div>
        )}

        <Button fullWidth size="lg" className="mt-3" onClick={() => void save()}>
          実績＋営業履歴を保存
        </Button>
      </Card>

      <Card>
        <details open>
          <summary className="font-bold cursor-pointer">あなたの転換率（{period === 'day' ? '選択日' : period === 'week' ? '今週' : '今月'}）</summary>
          <div className="mt-3">
            <ConversionRatesCard counts={myCounts} />
          </div>
        </details>
      </Card>

      <section>
        <h2 className="text-sm font-bold text-slate-700 mb-2">営業履歴ログ ({recentLogs.length})</h2>
        {recentLogs.slice(0, 15).map((l) => {
          const store = data.stores.find((s) => s.id === l.storeId);
          const logDisplayName = (store?.name ?? l.area) || '—';
          return (
            <Card key={l.id} className="mb-2 border-violet-100">
              <p className="font-medium text-sm">
                {logDisplayName}
                <span className="ml-2 text-xs bg-violet-100 text-violet-800 px-2 py-0.5 rounded-full">{l.outcome}</span>
              </p>
              <p className="text-xs text-slate-500">{l.visitedAt.slice(0, 10)}</p>
              {l.hitProposal && <p className="text-xs mt-1 text-emerald-800">刺さった: {l.hitProposal}</p>}
              {l.objectionHeard && <p className="text-xs text-amber-800">断り: {l.objectionHeard}</p>}
              {l.nextAction && <p className="text-xs text-slate-600">次回: {l.nextAction}</p>}
              <Button size="sm" variant="danger" className="mt-2" onClick={() => void removeSalesLog(l.id)}>
                削除
              </Button>
            </Card>
          );
        })}
      </section>

      <section>
        <h2 className="text-sm font-bold text-slate-700 mb-2">実績一覧 ({periodRecords.length})</h2>
        {periodRecords.slice(0, 30).map((r) => {
          const store = data.stores.find((s) => s.id === r.storeId);
          const recordDisplayName = (store?.name ?? r.area) || '—';
          return (
            <Card key={r.id} className="mb-2">
              <p className="font-medium">{recordDisplayName}</p>
              <p className="text-xs text-slate-500">{r.recordDate} · 訪問{r.visits} 獲得{r.won}</p>
              {r.quickMemo && <p className="text-sm mt-1">{r.quickMemo}</p>}
              <Button size="sm" variant="danger" className="mt-2" onClick={() => void removeRecord(r.id)}>
                削除
              </Button>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
