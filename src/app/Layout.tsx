import { Outlet } from 'react-router-dom';
import { BottomNav } from '@/components/ui/BottomNav';

export function Layout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/80 via-white to-slate-50 pb-24">
      <main className="mx-auto max-w-lg px-4 pt-4">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
