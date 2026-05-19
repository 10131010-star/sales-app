import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/', label: 'ホーム', icon: '🏠' },
  { to: '/compare', label: '比較', icon: '⚖️' },
  { to: '/stores', label: '店舗', icon: '🏪' },
  { to: '/sales', label: '営業', icon: '📝' },
  { to: '/knowledge', label: 'ナレッジ', icon: '💡' },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-lg justify-around">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition ${
                isActive ? 'text-indigo-600' : 'text-slate-500'
              }`
            }
          >
            <span className="text-xl">{tab.icon}</span>
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
