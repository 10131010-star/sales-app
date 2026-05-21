import { getStorageMode } from '@/lib/storage';

export function StorageModeBadge() {
  const mode = getStorageMode();
  const isShared = mode === 'supabase';

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
        isShared
          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
          : 'bg-slate-100 text-slate-600 border border-slate-200'
      }`}
      title={isShared ? 'チームでリアルタイム共有' : 'この端末のみ（localStorage）'}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isShared ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
      {isShared ? '共有モード：Supabase' : 'ローカルモード：localStorage'}
    </div>
  );
}
