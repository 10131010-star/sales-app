import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AppData, KnowledgeItem, SalesRecord, SalesTarget, Store } from '@/data/types';
import type { MemberId, SalesMemberId } from '@/data/constants';
import { MEMBERS } from '@/data/constants';
import { buildKnowledgeSeed } from '@/data/knowledgeSeed';
import { createRepository } from '@/lib/storage';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { periodKey } from '@/lib/kpi/periods';
import type { PeriodType } from '@/data/constants';

interface DataContextValue {
  data: AppData;
  loading: boolean;
  error: string | null;
  currentMemberId: SalesMemberId;
  setCurrentMemberId: (id: SalesMemberId) => void;
  refresh: () => Promise<void>;
  saveStore: (store: Store) => Promise<void>;
  removeStore: (id: string) => Promise<void>;
  saveRecord: (record: SalesRecord) => Promise<void>;
  removeRecord: (id: string) => Promise<void>;
  saveTarget: (target: SalesTarget) => Promise<void>;
  saveKnowledge: (item: KnowledgeItem) => Promise<void>;
  removeKnowledge: (id: string) => Promise<void>;
  recordsFor: (memberId: MemberId) => SalesRecord[];
}

const DataContext = createContext<DataContextValue | null>(null);
const MEMBER_KEY = 'sales-app:member';

function defaultTargets(): SalesTarget[] {
  const periods: PeriodType[] = ['day', 'week', 'month'];
  const targets: SalesTarget[] = [];
  const defaults = { visits: 15, frontOk: 10, metManager: 8, fullTalk: 6, prospect: 4, appointment: 3, verbalOk: 2, won: 1 };
  for (const periodType of periods) {
    for (const m of MEMBERS) {
      targets.push({
        id: '',
        periodType,
        periodKey: periodKey(periodType),
        memberId: m.id,
        visitsTarget: m.id === 'team' ? defaults.visits * 2 : defaults.visits,
        frontOkTarget: m.id === 'team' ? defaults.frontOk * 2 : defaults.frontOk,
        metManagerTarget: m.id === 'team' ? defaults.metManager * 2 : defaults.metManager,
        fullTalkTarget: m.id === 'team' ? defaults.fullTalk * 2 : defaults.fullTalk,
        prospectTarget: m.id === 'team' ? defaults.prospect * 2 : defaults.prospect,
        appointmentTarget: m.id === 'team' ? defaults.appointment * 2 : defaults.appointment,
        verbalOkTarget: m.id === 'team' ? defaults.verbalOk * 2 : defaults.verbalOk,
        wonTarget: m.id === 'team' ? defaults.won * 2 : defaults.won,
        updatedAt: new Date().toISOString(),
      });
    }
  }
  return targets;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMemberId, setCurrentMemberId] = useState<SalesMemberId>(
    () => (localStorage.getItem(MEMBER_KEY) as SalesMemberId) || 'nakata',
  );

  const repo = useMemo(() => {
    try {
      return createRepository();
    } catch {
      return null;
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!repo) {
      setError('SUPABASE_NOT_CONFIGURED');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await repo.seedKnowledgeIfEmpty(buildKnowledgeSeed());
      let loaded = await repo.load();
      const missingTargets = defaultTargets().filter(
        (dt) =>
          !loaded.salesTargets.some(
            (t) => t.periodType === dt.periodType && t.periodKey === dt.periodKey && t.memberId === dt.memberId,
          ),
      );
      for (const t of missingTargets) {
        await repo.upsertTarget(t);
      }
      if (missingTargets.length > 0) {
        loaded = await repo.load();
      }
      setData(loaded);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, [repo]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    localStorage.setItem(MEMBER_KEY, currentMemberId);
  }, [currentMemberId]);

  const patchData = useCallback((fn: (prev: AppData) => AppData) => {
    setData((prev) => (prev ? fn(prev) : prev));
  }, []);

  const saveStore = useCallback(
    async (store: Store) => {
      if (!repo) return;
      const saved = await repo.upsertStore(store);
      patchData((prev) => ({
        ...prev,
        stores: prev.stores.some((s) => s.id === saved.id)
          ? prev.stores.map((s) => (s.id === saved.id ? saved : s))
          : [saved, ...prev.stores],
      }));
    },
    [repo, patchData],
  );

  const removeStore = useCallback(
    async (id: string) => {
      if (!repo) return;
      await repo.deleteStore(id);
      patchData((prev) => ({ ...prev, stores: prev.stores.filter((s) => s.id !== id) }));
    },
    [repo, patchData],
  );

  const saveRecord = useCallback(
    async (record: SalesRecord) => {
      if (!repo) return;
      const saved = await repo.upsertRecord(record);
      patchData((prev) => ({
        ...prev,
        salesRecords: prev.salesRecords.some((r) => r.id === saved.id)
          ? prev.salesRecords.map((r) => (r.id === saved.id ? saved : r))
          : [saved, ...prev.salesRecords],
      }));
    },
    [repo, patchData],
  );

  const removeRecord = useCallback(
    async (id: string) => {
      if (!repo) return;
      await repo.deleteRecord(id);
      patchData((prev) => ({ ...prev, salesRecords: prev.salesRecords.filter((r) => r.id !== id) }));
    },
    [repo, patchData],
  );

  const saveTarget = useCallback(
    async (target: SalesTarget) => {
      if (!repo) return;
      const saved = await repo.upsertTarget(target);
      patchData((prev) => ({
        ...prev,
        salesTargets: prev.salesTargets.some((t) => t.id === saved.id)
          ? prev.salesTargets.map((t) => (t.id === saved.id ? saved : t))
          : [...prev.salesTargets, saved],
      }));
    },
    [repo, patchData],
  );

  const saveKnowledge = useCallback(
    async (item: KnowledgeItem) => {
      if (!repo) return;
      const saved = await repo.upsertKnowledge(item);
      patchData((prev) => ({
        ...prev,
        knowledgeItems: prev.knowledgeItems.some((k) => k.id === saved.id)
          ? prev.knowledgeItems.map((k) => (k.id === saved.id ? saved : k))
          : [saved, ...prev.knowledgeItems],
      }));
    },
    [repo, patchData],
  );

  const removeKnowledge = useCallback(
    async (id: string) => {
      if (!repo) return;
      await repo.deleteKnowledge(id);
      patchData((prev) => ({ ...prev, knowledgeItems: prev.knowledgeItems.filter((k) => k.id !== id) }));
    },
    [repo, patchData],
  );

  const recordsFor = useCallback(
    (memberId: MemberId) => {
      if (!data) return [];
      if (memberId === 'team') return data.salesRecords;
      return data.salesRecords.filter((r) => r.memberId === memberId);
    },
    [data],
  );

  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="max-w-md text-center space-y-4">
          <p className="text-4xl">⚙️</p>
          <h1 className="text-xl font-bold text-slate-900">Supabase の設定が必要です</h1>
          <p className="text-sm text-slate-600">
            チーム共有のため、<code className="bg-slate-200 px-1 rounded">.env</code> に Supabase の URL と anon key を設定してください。
          </p>
          <pre className="text-left text-xs bg-slate-800 text-slate-100 p-4 rounded-xl overflow-x-auto">
{`VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key`}
          </pre>
          <p className="text-xs text-slate-500">supabase/schema.sql を SQL Editor で実行してください。</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600">読み込み中...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-red-600 font-medium">{error ?? 'データがありません'}</p>
          <button type="button" className="mt-4 text-indigo-600 underline" onClick={() => void refresh()}>
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  return (
    <DataContext.Provider
      value={{
        data,
        loading,
        error,
        currentMemberId,
        setCurrentMemberId,
        refresh,
        saveStore,
        removeStore,
        saveRecord,
        removeRecord,
        saveTarget,
        saveKnowledge,
        removeKnowledge,
        recordsFor,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
