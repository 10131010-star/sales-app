import { Outlet } from 'react-router-dom';
import { BottomNav } from '@/components/ui/BottomNav';

export function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <main className="mx-auto max-w-lg px-4 pt-4 relative z-0">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
