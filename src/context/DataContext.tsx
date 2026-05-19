import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AppData } from '@/data/types';
import { createRepository } from '@/lib/storage';
import { format, addDays } from 'date-fns';

interface DataContextValue {
  data: AppData;
  loading: boolean;
  currentMemberId: string;
  setCurrentMemberId: (id: string) => void;
  update: (fn: (prev: AppData) => AppData) => Promise<void>;
  refresh: () => Promise<void>;
  organizeTomorrowActions: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);
const repo = createRepository();
const MEMBER_KEY = 'sales-app:member';

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentMemberId, setCurrentMemberId] = useState(
    () => localStorage.getItem(MEMBER_KEY) ?? 'hiroto',
  );

  const refresh = useCallback(async () => {
    const loaded = await repo.load();
    setData(loaded);
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  useEffect(() => {
    localStorage.setItem(MEMBER_KEY, currentMemberId);
  }, [currentMemberId]);

  const update = useCallback(async (fn: (prev: AppData) => AppData) => {
    setData((prev) => {
      if (!prev) return prev;
      const next = fn(prev);
      void repo.save(next);
      return next;
    });
  }, []);

  const organizeTomorrowActions = useCallback(async () => {
    const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    await update((prev) => {
      const existing = new Set(prev.todos.filter((t) => t.dueDate === tomorrow).map((t) => t.title));
      const newTodos = prev.stores
        .filter((s) => s.nextAction?.trim())
        .filter((s) => !existing.has(`${s.name}: ${s.nextAction}`))
        .map((s) => ({
          id: crypto.randomUUID(),
          title: `${s.name}: ${s.nextAction}`,
          storeId: s.id,
          memberId: currentMemberId,
          dueDate: tomorrow,
          completed: false,
          source: 'auto_tomorrow' as const,
          createdAt: new Date().toISOString(),
        }));
      return { ...prev, todos: [...prev.todos, ...newTodos] };
    });
  }, [update, currentMemberId]);

  const value = useMemo(
    () =>
      data
        ? {
            data,
            loading,
            currentMemberId,
            setCurrentMemberId,
            update,
            refresh,
            organizeTomorrowActions,
          }
        : null,
    [data, loading, currentMemberId, update, refresh, organizeTomorrowActions],
  );

  if (loading || !value) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="mb-2 text-4xl">📊</p>
          <p className="text-slate-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
