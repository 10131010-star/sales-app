import { CONVERSION_META, calcConversionRates, formatPct } from '@/lib/kpi/calculations';
import type { KpiCounts } from '@/data/types';

export function ConversionRatesCard({ counts }: { counts: KpiCounts }) {
  const rates = calcConversionRates(counts);
  return (
    <div className="space-y-3">
      {CONVERSION_META.map((m) => (
        <div key={m.key} className="border-b border-slate-50 pb-2 last:border-0">
          <div className="flex justify-between items-baseline">
            <span className="text-sm font-semibold text-slate-800">{m.label}</span>
            <span className="text-lg font-bold text-violet-700">{formatPct(rates[m.key])}</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{m.hint}</p>
        </div>
      ))}
    </div>
  );
}
