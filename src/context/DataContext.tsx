import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { SalesLog } from '@/data/salesLog/types';
import type { StoreReview } from '@/data/reviews/types';
import type { AppData, KnowledgeItem, SalesRecord, SalesTarget, Store } from '@/data/types';
import type { MemberId, SalesMemberId } from '@/data/constants';
import { MEMBERS } from '@/data/constants';
import { buildKnowledgeSeed } from '@/data/seedKnowledge';
import { createRepository, getStorageMode, type StorageMode } from '@/lib/storage';
import { periodKey } from '@/lib/kpi/periods';
import type { PeriodType } from '@/data/constants';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { subscribeKnowledgeRealtime } from '@/lib/supabase/knowledgeRealtime';

interface DataContextValue {
  data: AppData;
  loading: boolean;
  error: string | null;
  storageMode: StorageMode;
  currentMemberId: SalesMemberId;
  setCurrentMemberId: (id: SalesMemberId) => void;
  refresh: () => Promise<void>;
  saveStore: (store: Store) => Promise<void>;
  removeStore: (id: string) => Promise<void>;
  saveRecord: (record: SalesRecord) => Promise<void>;
  removeRecord: (id: string) => Promise<void>;
  saveSalesLog: (log: SalesLog) => Promise<void>;
  removeSalesLog: (id: string) => Promise<void>;
  saveStoreReview: (review: StoreReview) => Promise<void>;
  removeStoreReview: (id: string) => Promise<void>;
  saveTarget: (target: SalesTarget) => Promise<void>;
  saveKnowledge: (item: KnowledgeItem) => Promise<void>;
  removeKnowledge: (id: string) => Promise<void>;
  recordsFor: (memberId: MemberId) => SalesRecord[];
  knowledgeSyncNotice: boolean;
  dismissKnowledgeSyncNotice: () => void;
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
  const [knowledgeSyncNotice, setKnowledgeSyncNotice] = useState(false);
  const [currentMemberId, setCurrentMemberId] = useState<SalesMemberId>(
    () => (localStorage.getItem(MEMBER_KEY) as SalesMemberId) || 'nakata',
  );

  const storageMode = useMemo(() => getStorageMode(), []);
  const repo = useMemo(() => createRepository(), []);
  const knowledgeWriteRef = useRef<Set<string>>(new Set());
  const syncNoticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showKnowledgeSyncNotice = useCallback(() => {
    setKnowledgeSyncNotice(true);
    if (syncNoticeTimerRef.current) clearTimeout(syncNoticeTimerRef.current);
    syncNoticeTimerRef.current = setTimeout(() => setKnowledgeSyncNotice(false), 4000);
  }, []);

  const dismissKnowledgeSyncNotice = useCallback(() => {
    setKnowledgeSyncNotice(false);
    if (syncNoticeTimerRef.current) clearTimeout(syncNoticeTimerRef.current);
  }, []);

  const refresh = useCallback(async () => {
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
      setData({
        ...loaded,
        salesLogs: loaded.salesLogs ?? [],
        storeReviews: loaded.storeReviews ?? [],
      });
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

  const applyKnowledgeRealtime = useCallback(
    (payload: { event: 'INSERT' | 'UPDATE' | 'DELETE'; item?: KnowledgeItem; deletedId?: string }) => {
      if (payload.event === 'DELETE' && payload.deletedId) {
        if (knowledgeWriteRef.current.has(payload.deletedId)) return;
        patchData((prev) => ({
          ...prev,
          knowledgeItems: prev.knowledgeItems.filter((k) => k.id !== payload.deletedId),
        }));
        showKnowledgeSyncNotice();
        return;
      }
      const item = payload.item;
      if (!item) return;
      if (knowledgeWriteRef.current.has(item.id)) return;

      patchData((prev) => {
        const list = [...prev.knowledgeItems];
        const idx = list.findIndex((k) => k.id === item.id);
        if (payload.event === 'INSERT') {
          if (idx >= 0) {
            if (list[idx].updatedAt === item.updatedAt) return prev;
            list[idx] = item;
          } else {
            list.unshift(item);
          }
        } else if (idx >= 0) {
          if (list[idx].updatedAt === item.updatedAt) return prev;
          list[idx] = item;
        } else {
          list.unshift(item);
        }
        return { ...prev, knowledgeItems: list };
      });
      showKnowledgeSyncNotice();
    },
    [patchData, showKnowledgeSyncNotice],
  );

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    return subscribeKnowledgeRealtime(applyKnowledgeRealtime);
  }, [applyKnowledgeRealtime]);

  const saveStore = useCallback(
    async (store: Store) => {
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
      await repo.deleteStore(id);
      patchData((prev) => ({ ...prev, stores: prev.stores.filter((s) => s.id !== id) }));
    },
    [repo, patchData],
  );

  const saveRecord = useCallback(
    async (record: SalesRecord) => {
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
      await repo.deleteRecord(id);
      patchData((prev) => ({ ...prev, salesRecords: prev.salesRecords.filter((r) => r.id !== id) }));
    },
    [repo, patchData],
  );

  const saveSalesLog = useCallback(
    async (log: SalesLog) => {
      const saved = await repo.upsertSalesLog(log);
      patchData((prev) => ({
        ...prev,
        salesLogs: (prev.salesLogs ?? []).some((l) => l.id === saved.id)
          ? (prev.salesLogs ?? []).map((l) => (l.id === saved.id ? saved : l))
          : [saved, ...(prev.salesLogs ?? [])],
      }));
    },
    [repo, patchData],
  );

  const removeSalesLog = useCallback(
    async (id: string) => {
      await repo.deleteSalesLog(id);
      patchData((prev) => ({
        ...prev,
        salesLogs: (prev.salesLogs ?? []).filter((l) => l.id !== id),
      }));
    },
    [repo, patchData],
  );

  const saveStoreReview = useCallback(
    async (review: StoreReview) => {
      const saved = await repo.upsertStoreReview(review);
      patchData((prev) => ({
        ...prev,
        storeReviews: (prev.storeReviews ?? []).some((r) => r.id === saved.id)
          ? (prev.storeReviews ?? []).map((r) => (r.id === saved.id ? saved : r))
          : [saved, ...(prev.storeReviews ?? [])],
      }));
    },
    [repo, patchData],
  );

  const removeStoreReview = useCallback(
    async (id: string) => {
      await repo.deleteStoreReview(id);
      patchData((prev) => ({
        ...prev,
        storeReviews: (prev.storeReviews ?? []).filter((r) => r.id !== id),
      }));
    },
    [repo, patchData],
  );

  const saveTarget = useCallback(
    async (target: SalesTarget) => {
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
      knowledgeWriteRef.current.add(item.id);
      try {
        const saved = await repo.upsertKnowledge(item);
        patchData((prev) => ({
          ...prev,
          knowledgeItems: prev.knowledgeItems.some((k) => k.id === saved.id)
            ? prev.knowledgeItems.map((k) => (k.id === saved.id ? saved : k))
            : [saved, ...prev.knowledgeItems],
        }));
      } finally {
        setTimeout(() => knowledgeWriteRef.current.delete(item.id), 1500);
      }
    },
    [repo, patchData],
  );

  const removeKnowledge = useCallback(
    async (id: string) => {
      knowledgeWriteRef.current.add(id);
      try {
        await repo.deleteKnowledge(id);
        patchData((prev) => ({ ...prev, knowledgeItems: prev.knowledgeItems.filter((k) => k.id !== id) }));
      } finally {
        setTimeout(() => knowledgeWriteRef.current.delete(id), 1500);
      }
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
        saveSalesLog,
        removeSalesLog,
        saveStoreReview,
        removeStoreReview,
        saveTarget,
        storageMode,
        saveKnowledge,
        removeKnowledge,
        recordsFor,
        knowledgeSyncNotice,
        dismissKnowledgeSyncNotice,
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
