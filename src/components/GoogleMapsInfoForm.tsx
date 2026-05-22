import { useEffect, useState } from 'react';
import type { Store } from '@/data/types';
import type { GoogleMapsInfo } from '@/data/googleMaps/types';
import { GOOGLE_MAPS_STATUS_LABELS } from '@/data/googleMaps/types';
import { loadGoogleMapsInfo, saveGoogleMapsInfo } from '@/lib/googleMaps/storage';
import { validateGoogleMapsInfo } from '@/lib/googleMaps/validate';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface GoogleMapsInfoFormProps {
  store: Store;
  onSaved?: (info: GoogleMapsInfo) => void;
}

export function GoogleMapsInfoForm({ store, onSaved }: GoogleMapsInfoFormProps) {
  const [open, setOpen] = useState(true);
  const [form, setForm] = useState<GoogleMapsInfo>(() => loadGoogleMapsInfo(store.id));
  const [errors, setErrors] = useState<Partial<Record<keyof GoogleMapsInfo, string>>>({});
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    const loaded = loadGoogleMapsInfo(store.id);
    setForm({
      ...loaded,
      mapsUrl: loaded.mapsUrl || store.googleMapUrl || '',
      placeName: loaded.placeName || store.name,
      address: loaded.address || store.address,
      genre: loaded.genre || store.businessType,
      hours: loaded.hours || store.hours,
    });
  }, [store.id, store.googleMapUrl, store.name, store.address, store.businessType, store.hours]);

  const patch = (partial: Partial<GoogleMapsInfo>) => {
    setForm((f) => ({ ...f, ...partial }));
    setErrors({});
    setSavedMsg('');
  };

  const numOrNull = (raw: string): number | null => {
    const t = raw.trim();
    if (t === '') return null;
    const n = Number(t);
    return Number.isNaN(n) ? null : n;
  };

  const save = () => {
    const { valid, errors: errs, normalized } = validateGoogleMapsInfo(store.id, {
      ...form,
      storeId: store.id,
      mapsUrl: form.mapsUrl || store.googleMapUrl || '',
      placeName: form.placeName || store.name,
      address: form.address || store.address,
      genre: form.genre || store.businessType,
      hours: form.hours || store.hours,
      dataStatus: 'manual',
    });
    setErrors(errs);
    if (!valid) return;
    const saved = saveGoogleMapsInfo(normalized);
    setForm(saved);
    setSavedMsg('保存しました。分析レポートが更新されます。');
    onSaved?.(saved);
  };

  const markCaptured = () => {
    patch({ dataStatus: 'captured' });
    setSavedMsg('状態を「取得済み」にしました。保存ボタンで確定してください。');
  };

  const statusLabel = GOOGLE_MAPS_STATUS_LABELS[form.dataStatus];

  return (
    <Card className="border-dashed border-blue-200 bg-blue-50/40">
      <button
        type="button"
        className="w-full flex justify-between items-center text-left min-h-[44px]"
        onClick={() => setOpen(!open)}
      >
        <span className="text-sm font-semibold text-blue-900">Google Maps情報</span>
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">{statusLabel}</span>
      </button>
      {open && (
        <div className="mt-3 pt-3 border-t border-blue-100 space-y-3">
          <p className="text-xs text-slate-600">
            Maps画面から手入力で登録してください（外部APIなし）。分析・根拠表示に反映されます。
          </p>

          <label className="block text-sm">
            Google Maps URL
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2 min-h-[44px] text-sm"
              placeholder="https://www.google.com/maps/place/..."
              value={form.mapsUrl}
              onChange={(e) => patch({ mapsUrl: e.target.value })}
            />
            {errors.mapsUrl && <span className="text-xs text-red-600">{errors.mapsUrl}</span>}
          </label>

          <label className="block text-sm">
            店舗名
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2 min-h-[44px]"
              value={form.placeName}
              onChange={(e) => patch({ placeName: e.target.value })}
              placeholder={store.name}
            />
          </label>

          <label className="block text-sm">
            住所
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2 min-h-[44px]"
              value={form.address}
              onChange={(e) => patch({ address: e.target.value })}
              placeholder={store.address}
            />
          </label>

          <label className="block text-sm">
            業態 / ジャンル
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2 min-h-[44px]"
              value={form.genre}
              onChange={(e) => patch({ genre: e.target.value })}
              placeholder={store.businessType}
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="block text-sm">
              評価（0〜5）
              <input
                type="number"
                step={0.1}
                min={0}
                max={5}
                className="mt-1 w-full rounded-xl border px-3 py-2 min-h-[44px]"
                value={form.rating ?? ''}
                onChange={(e) => patch({ rating: numOrNull(e.target.value) })}
              />
              {errors.rating && <span className="text-xs text-red-600">{errors.rating}</span>}
            </label>
            <label className="block text-sm">
              レビュー件数
              <input
                type="number"
                min={0}
                className="mt-1 w-full rounded-xl border px-3 py-2 min-h-[44px]"
                value={form.reviewCount ?? ''}
                onChange={(e) => patch({ reviewCount: numOrNull(e.target.value) })}
              />
            </label>
          </div>

          <label className="block text-sm">
            営業時間
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2 min-h-[44px]"
              value={form.hours}
              onChange={(e) => patch({ hours: e.target.value })}
              placeholder={store.hours || '例: 11:00-23:00'}
            />
          </label>

          <label className="block text-sm">
            写真枚数
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-xl border px-3 py-2 min-h-[44px]"
              value={form.photoCount ?? ''}
              onChange={(e) => patch({ photoCount: numOrNull(e.target.value) })}
            />
          </label>

          <label className="block text-sm">
            最新口コミ（抜粋）
            <textarea
              className="mt-1 w-full rounded-xl border px-3 py-2 min-h-[72px] text-sm"
              value={form.latestReviews}
              onChange={(e) => patch({ latestReviews: e.target.value })}
              placeholder="直近の口コミを貼り付け"
            />
          </label>

          <label className="block text-sm">
            ポジティブ傾向
            <textarea
              className="mt-1 w-full rounded-xl border px-3 py-2 min-h-[60px] text-sm"
              value={form.positiveTrend}
              onChange={(e) => patch({ positiveTrend: e.target.value })}
              placeholder="例: 味が美味しい、コスパが良い"
            />
          </label>

          <label className="block text-sm">
            ネガティブ傾向
            <textarea
              className="mt-1 w-full rounded-xl border px-3 py-2 min-h-[60px] text-sm"
              value={form.negativeTrend}
              onChange={(e) => patch({ negativeTrend: e.target.value })}
              placeholder="例: 提供が遅い、待ち時間が長い"
            />
          </label>

          <div className="flex gap-2">
            <Button fullWidth onClick={save}>
              Google Maps情報を保存
            </Button>
            <Button variant="secondary" onClick={markCaptured}>
              取得済み
            </Button>
          </div>
          {savedMsg && <p className="text-xs text-blue-700 font-medium">{savedMsg}</p>}
          <p className="text-[10px] text-slate-400">最終更新: {new Date(form.updatedAt).toLocaleString('ja-JP')}</p>
        </div>
      )}
    </Card>
  );
}
