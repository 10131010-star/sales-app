interface ChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  color?: string;
}

export function Chip({ label, active, onClick, color }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition min-h-[44px] pointer-events-auto ${
        active ? 'bg-violet-600 text-white shadow-md' : 'bg-white text-slate-700 border border-slate-200'
      }`}
      style={active && color ? { backgroundColor: color } : undefined}
    >
      {label}
    </button>
  );
}
