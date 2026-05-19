import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '@/context/DataContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { SERVICE_LABELS, type ServiceId } from '@/data/types';

export function AnalysisPage() {
  const { data } = useData();

  const areaStats = useMemo(() => {
    const map = new Map<string, { total: number; notAdopted: Record<ServiceId, number> }>();
    for (const s of data.stores) {
      if (!map.has(s.area)) map.set(s.area, { total: 0, notAdopted: { uber_eats: 0, demae_can: 0, menu: 0, rocket_now: 0 } });
      const e = map.get(s.area)!;
      e.total++;
      for (const sid of s.notAdoptedServices) e.notAdopted[sid]++;
    }
    return [...map.entries()].sort((a, b) => b[1].total - a[1].total);
  }, [data.stores]);

  const bizStats = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of data.stores) map.set(s.businessType, (map.get(s.businessType) ?? 0) + 1);
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [data.stores]);

  const popularStores = useMemo(
    () => [...data.stores].sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0)).slice(0, 5),
    [data.stores],
  );

  const platformAreaStrength = useMemo(() => {
    return data.platforms.map((p) => ({
      name: SERVICE_LABELS[p.serviceId],
      areas: p.strongAreas,
    }));
  }, [data.platforms]);

  return (
    <div className="space-y-4">
      <PageHeader title="分析ダッシュボード" subtitle="エリア・業態・人気店舗" />
      <Link to="/" className="text-sm text-indigo-600">← ホームに戻る</Link>

      <Card>
        <h3 className="font-bold text-slate-800 mb-3">強いエリア分析（4社マスタ）</h3>
        {platformAreaStrength.map((p) => (
          <div key={p.name} className="mb-3 last:mb-0">
            <p className="text-sm font-semibold text-slate-700">{p.name}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {p.areas.map((a) => (
                <span key={a} className="text-xs bg-violet-100 text-violet-800 px-2 py-1 rounded-full">{a}</span>
              ))}
            </div>
          </div>
        ))}
      </Card>

      <Card>
        <h3 className="font-bold text-slate-800 mb-3">エリア別・未導入機会</h3>
        {areaStats.map(([area, stat]) => (
          <div key={area} className="border-b border-slate-100 py-3 last:border-0">
            <div className="flex justify-between">
              <span className="font-medium">{area}</span>
              <span className="text-slate-500 text-sm">{stat.total}店</span>
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              {(Object.keys(stat.notAdopted) as ServiceId[]).map((sid) =>
                stat.notAdopted[sid] > 0 ? (
                  <span key={sid} className="text-xs bg-amber-50 text-amber-800 px-2 py-0.5 rounded">
                    {SERVICE_LABELS[sid]}未導入 {stat.notAdopted[sid]}
                  </span>
                ) : null,
              )}
            </div>
          </div>
        ))}
      </Card>

      <Card>
        <h3 className="font-bold text-slate-800 mb-3">業態別分析</h3>
        {bizStats.map(([biz, count]) => (
          <div key={biz} className="flex items-center gap-2 py-2">
            <span className="w-20 text-sm font-medium">{biz}</span>
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full"
                style={{ width: `${(count / (data.stores.length || 1)) * 100}%` }}
              />
            </div>
            <span className="text-sm text-slate-500 w-8 text-right">{count}</span>
          </div>
        ))}
      </Card>

      <Card>
        <h3 className="font-bold text-slate-800 mb-3">人気店舗分析（レビュー数）</h3>
        {popularStores.map((s, i) => (
          <Link key={s.id} to={`/stores/${s.id}`} className="block py-2 border-b border-slate-100 last:border-0">
            <span className="text-indigo-600 font-bold mr-2">#{i + 1}</span>
            {s.name}
            <span className="text-sm text-slate-500 ml-2">★{s.rating} · {s.reviewCount}件</span>
          </Link>
        ))}
      </Card>

      <Card>
        <h3 className="font-bold text-slate-800 mb-3">未導入店舗</h3>
        <p className="text-sm text-slate-600 mb-2">
          {data.stores.filter((s) => s.notAdoptedServices.length > 0).length} 件がアプローチ候補
        </p>
        <Link to="/stores?filter=not_adopted" className="text-indigo-600 font-medium text-sm">
          未導入一覧を見る →
        </Link>
      </Card>
    </div>
  );
}
