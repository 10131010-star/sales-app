import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useData } from '@/context/DataContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { ServiceBadge } from '@/components/ui/ServiceBadge';
import { AREAS, BUSINESS_TYPES, PRICE_LABELS } from '@/data/types';
import { uid } from '@/lib/utils';

export function StoresPage() {
  const { data, update } = useData();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [area, setArea] = useState('');
  const [businessType, setBusinessType] = useState('');
  const notAdoptedOnly = searchParams.get('filter') === 'not_adopted';

  const filtered = useMemo(() => {
    return data.stores.filter((s) => {
      if (notAdoptedOnly && s.notAdoptedServices.length === 0) return false;
      if (area && s.area !== area) return false;
      if (businessType && s.businessType !== businessType) return false;
      if (search && !s.name.includes(search) && !s.area.includes(search)) return false;
      return true;
    });
  }, [data.stores, search, area, businessType, notAdoptedOnly]);

  const addStore = () => {
    const id = uid();
    const now = new Date().toISOString();
    void update((prev) => ({
      ...prev,
      stores: [
        {
          id,
          name: '新規店舗',
          area: '渋谷',
          businessType: 'その他',
          adoptedServices: [],
          notAdoptedServices: ['uber_eats', 'demae_can', 'menu', 'rocket_now'],
          hours: '',
          priceRange: 'mid',
          photoStrength: 3,
          popularMenus: [],
          priorityArea: false,
          prospectLevel: 'none',
          createdAt: now,
          updatedAt: now,
        },
        ...prev.stores,
      ],
    }));
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="店舗カルテ"
        subtitle={notAdoptedOnly ? '未導入店舗' : `${filtered.length}件`}
        action={
          <Button size="sm" onClick={addStore}>
            + 追加
          </Button>
        }
      />

      <input
        type="search"
        placeholder="店名・エリアで検索"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base min-h-[48px]"
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
        <Chip label="全エリア" active={!area} onClick={() => setArea('')} />
        {AREAS.map((a) => (
          <Chip key={a} label={a} active={area === a} onClick={() => setArea(a === area ? '' : a)} />
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <Chip label="全業態" active={!businessType} onClick={() => setBusinessType('')} />
        {BUSINESS_TYPES.slice(0, 6).map((b) => (
          <Chip
            key={b}
            label={b}
            active={businessType === b}
            onClick={() => setBusinessType(b === businessType ? '' : b)}
          />
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((s) => (
          <Link key={s.id} to={`/stores/${s.id}`}>
            <Card accent={s.prospectLevel === 'high' ? '#10b981' : s.prospectLevel === 'mid' ? '#f59e0b' : undefined}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-900">{s.name}</h3>
                  <p className="text-sm text-slate-500">{s.area} · {s.businessType} · {PRICE_LABELS[s.priceRange]}</p>
                </div>
                {s.priorityArea && <span className="text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded-full">重点</span>}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {s.adoptedServices.map((id) => (
                  <ServiceBadge key={id} id={id} small />
                ))}
              </div>
              {s.notAdoptedServices.length > 0 && (
                <p className="mt-2 text-xs text-amber-700">
                  未導入: {s.notAdoptedServices.length}サービス
                </p>
              )}
              {s.nextAction && (
                <p className="mt-2 text-sm text-indigo-600">→ {s.nextAction}</p>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
