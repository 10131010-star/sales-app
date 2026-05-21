import { Outlet } from 'react-router-dom';
import { BottomNav } from '@/components/ui/BottomNav';
import { StorageModeBadge } from '@/components/StorageModeBadge';
import { SyncNotice } from '@/components/SyncNotice';
import { useData } from '@/context/DataContext';

export function Layout() {
  const { knowledgeSyncNotice, dismissKnowledgeSyncNotice } = useData();

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <SyncNotice visible={knowledgeSyncNotice} onDismiss={dismissKnowledgeSyncNotice} />
      <div className="mx-auto max-w-lg px-4 pt-2 flex justify-end">
        <StorageModeBadge />
      </div>
      <main className="mx-auto max-w-lg px-4 pt-2 relative z-0">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
