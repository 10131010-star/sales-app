import { useParams, useNavigate, Link } from 'react-router-dom';
import { useData } from '@/context/DataContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import {
  AREAS,
  BUSINESS_TYPES,
  OWNER_TYPES,
  PRICE_LABELS,
  SERVICE_LABELS,
  type ServiceId,
  type StoreCard,
} from '@/data/types';

const ALL_SERVICES: ServiceId[] = ['uber_eats', 'demae_can', 'menu', 'rocket_now'];

function Field({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value?: string | number;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  const common = 'w-full rounded-xl border border-slate-200 px-3 py-2 text-sm mt-1';
  return (
    <label className="block text-sm">
      <span className="font-medium text-slate-600">{label}</span>
      {multiline ? (
        <textarea
          className={`${common} min-h-[72px]`}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className={common}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}

export function StoreDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, update } = useData();
  const store = data.stores.find((s) => s.id === id);

  if (!store) {
    return <p className="text-slate-500">店舗が見つかりません</p>;
  }

  const patch = (partial: Partial<StoreCard>) => {
    void update((prev) => ({
      ...prev,
      stores: prev.stores.map((s) =>
        s.id === store.id ? { ...s, ...partial, updatedAt: new Date().toISOString() } : s,
      ),
    }));
  };

  const toggleService = (serviceId: ServiceId, adopted: boolean) => {
    const adoptedServices = adopted
      ? [...new Set([...store.adoptedServices, serviceId])]
      : store.adoptedServices.filter((x) => x !== serviceId);
    const notAdoptedServices = ALL_SERVICES.filter((x) => !adoptedServices.includes(x));
    patch({ adoptedServices, notAdoptedServices });
  };

  return (
    <div className="space-y-4 pb-8">
      <PageHeader
        title={store.name}
        subtitle={`${store.area} · ${store.businessType}`}
        action={
          <Button size="sm" variant="ghost" onClick={() => navigate(-1)}>
            戻る
          </Button>
        }
      />

      <Link to={`/sales?store=${store.id}`}>
        <Button fullWidth size="lg">
          📝 訪問ログ・クイック入力
        </Button>
      </Link>

      <Card>
        <h3 className="font-bold text-slate-800 mb-3">基本情報</h3>
        <div className="space-y-3">
          <Field label="店名" value={store.name} onChange={(v) => patch({ name: v })} />
          <label className="block text-sm">
            <span className="font-medium text-slate-600">エリア</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {AREAS.map((a) => (
                <Chip key={a} label={a} active={store.area === a} onClick={() => patch({ area: a })} />
              ))}
            </div>
          </label>
          <label className="block text-sm">
            <span className="font-medium text-slate-600">業態</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {BUSINESS_TYPES.map((b) => (
                <Chip key={b} label={b} active={store.businessType === b} onClick={() => patch({ businessType: b })} />
              ))}
            </div>
          </label>
          <Field label="営業時間" value={store.hours} onChange={(v) => patch({ hours: v })} />
          <label className="block text-sm">
            <span className="font-medium text-slate-600">価格帯</span>
            <div className="flex gap-1 mt-1">
              {(['low', 'mid', 'high'] as const).map((p) => (
                <Chip
                  key={p}
                  label={PRICE_LABELS[p]}
                  active={store.priceRange === p}
                  onClick={() => patch({ priceRange: p })}
                />
              ))}
            </div>
          </label>
        </div>
      </Card>

      <Card>
        <h3 className="font-bold text-slate-800 mb-3">導入サービス</h3>
        <div className="space-y-2">
          {ALL_SERVICES.map((sid) => {
            const adopted = store.adoptedServices.includes(sid);
            return (
              <button
                key={sid}
                type="button"
                onClick={() => toggleService(sid, !adopted)}
                className={`w-full flex justify-between items-center rounded-xl px-4 py-3 min-h-[48px] border ${
                  adopted ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className="font-medium">{SERVICE_LABELS[sid]}</span>
                <span className="text-sm">{adopted ? '✓ 導入済' : '未導入'}</span>
              </button>
            );
          })}
        </div>
      </Card>

      <Card>
        <h3 className="font-bold text-slate-800 mb-3">店舗分析</h3>
        <div className="space-y-3">
          <Field label="商品数" value={store.productCount} onChange={(v) => patch({ productCount: Number(v) || undefined })} />
          <label className="block text-sm">
            <span className="font-medium text-slate-600">写真の強さ (1-5)</span>
            <div className="flex gap-1 mt-1">
              {([1, 2, 3, 4, 5] as const).map((n) => (
                <Chip
                  key={n}
                  label={String(n)}
                  active={store.photoStrength === n}
                  onClick={() => patch({ photoStrength: n })}
                />
              ))}
            </div>
          </label>
          <Field label="レビュー数" value={store.reviewCount} onChange={(v) => patch({ reviewCount: Number(v) || undefined })} />
          <Field label="評価" value={store.rating} onChange={(v) => patch({ rating: Number(v) || undefined })} />
          <Field label="人気メニュー（カンマ区切り）" value={store.popularMenus.join(', ')} onChange={(v) => patch({ popularMenus: v.split(/[,、]/).map((x) => x.trim()).filter(Boolean) })} />
          <Field label="セット設計" value={store.setDesign} onChange={(v) => patch({ setDesign: v })} multiline />
          <Field label="想定客層" value={store.targetCustomers} onChange={(v) => patch({ targetCustomers: v })} />
          <label className="block text-sm">
            <span className="font-medium text-slate-600">店主タイプ</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {OWNER_TYPES.map((o) => (
                <Chip key={o} label={o} active={store.ownerType === o} onClick={() => patch({ ownerType: o })} />
              ))}
            </div>
          </label>
        </div>
      </Card>

      <Card>
        <h3 className="font-bold text-slate-800 mb-3">営業メモ</h3>
        <div className="space-y-3">
          <Field label="導入メリット仮説" value={store.benefitHypothesis} onChange={(v) => patch({ benefitHypothesis: v })} multiline />
          <Field label="懸念点" value={store.concerns} onChange={(v) => patch({ concerns: v })} multiline />
          <Field label="刺さりそうな営業トーク" value={store.pitchTalk} onChange={(v) => patch({ pitchTalk: v })} multiline />
          <Field label="次回アクション" value={store.nextAction} onChange={(v) => patch({ nextAction: v })} multiline />
          <label className="block text-sm">
            <span className="font-medium text-slate-600">見込み</span>
            <div className="flex gap-1 mt-1">
              {(['none', 'low', 'mid', 'high'] as const).map((l) => (
                <Chip
                  key={l}
                  label={l === 'none' ? 'なし' : l === 'low' ? '低' : l === 'mid' ? '中' : '高'}
                  active={store.prospectLevel === l}
                  onClick={() => patch({ prospectLevel: l })}
                />
              ))}
            </div>
          </label>
          <Chip
            label={store.priorityArea ? '★ 重点エリア' : '重点エリアに設定'}
            active={store.priorityArea}
            onClick={() => patch({ priorityArea: !store.priorityArea })}
          />
        </div>
      </Card>
    </div>
  );
}
