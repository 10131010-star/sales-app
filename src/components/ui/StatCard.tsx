interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}

export function StatCard({ label, value, sub, color = '#6366f1' }: StatCardProps) {
  return (
    <div
      className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100"
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}
