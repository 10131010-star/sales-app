import { useMemo, useState } from 'react';
import { useData } from '@/context/DataContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { analyzeReviewText } from '@/lib/reviews/analyze';
import {
  REVIEW_DIMENSION_KEYS,
  REVIEW_DIMENSION_LABELS,
  normalizeReviewDimensions,
  type ReviewDimensionKey,
  type ReviewDimensionScores,
} from '@/data/reviews/types';
import type { Store } from '@/data/types';
import { uid } from '@/lib/utils';

const EMPTY_DIMS = (): ReviewDimensionScores =>
  Object.fromEntries(REVIEW_DIMENSION_KEYS.map((k) => [k, null])) as ReviewDimensionScores;

interface StoreReviewFormProps {
  store: Store;
}

export function StoreReviewForm({ store }: StoreReviewFormProps) {
  const { data, saveStoreReview, removeStoreReview } = useData();
  const existing = (data.storeReviews ?? []).filter((r) => r.storeId === store.id);
  const [open, setOpen] = useState(false);
  const [rawText, setRawText] = useState('');
  const [rating, setRating] = useState(4.0);
  const [reviewCount, setReviewCount] = useState(20);
  const [manualDims, setManualDims] = useState<ReviewDimensionScores>(EMPTY_DIMS);
  const [preview, setPreview] = useState<ReturnType<typeof analyzeReviewText> | null>(null);

  const setDim = (key: ReviewDimensionKey, value: number) => {
    setManualDims((d) => ({ ...d, [key]: value }));
  };

  const runPreview = () => {
    if (!rawText.trim()) return;
    setPreview(
      analyzeReviewText({
        storeId: store.id,
        storeName: store.name,
        area: store.area,
        businessType: store.businessType,
        rating,
        reviewCount,
        rawText,
        manualDimensions: manualDims,
      }),
    );
  };

  const autoFillFromText = () => {
    if (!rawText.trim()) return;
    const auto = analyzeReviewText({
      storeId: store.id,
      storeName: store.name,
      area: store.area,
      businessType: store.businessType,
      rating,
      reviewCount,
      rawText,
    });
    setManualDims(auto.dimensions);
    setPreview(auto);
  };

  const save = async () => {
    const analyzed =
      preview ??
      analyzeReviewText({
        storeId: store.id,
        storeName: store.name,
        area: store.area,
        businessType: store.businessType,
        rating,
        reviewCount,
        rawText,
        manualDimensions: manualDims,
      });
    const now = new Date().toISOString();
    await saveStoreReview({
      ...analyzed,
      id: uid(),
      analyzedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    setRawText('');
    setManualDims(EMPTY_DIMS());
    setPreview(null);
    setOpen(false);
  };

  const dimensionPreview = useMemo(() => preview?.dimensions ?? manualDims, [preview, manualDims]);

  return (
    <Card className="border-dashed border-emerald-200 bg-emerald-50/30">
      <button
        type="button"
        className="w-full flex justify-between items-center text-left min-h-[44px]"
        onClick={() => setOpen(!open)}
      >
        <span className="text-sm font-semibold text-emerald-900">口コミを登録・分類（分析の根拠）</span>
        <span className="text-slate-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="mt-3 pt-3 border-t border-emerald-100 space-y-3">
          <p className="text-xs text-slate-600">
            口コミ本文を貼り付けて自動分類するか、8軸を手動で1〜5点入力してください。分析レポートの提案根拠になります。
          </p>
          <label className="block text-sm">
            総合評価（5点満点）
            <input
              type="number"
              step={0.1}
              min={1}
              max={5}
              className="mt-1 w-full rounded-xl border px-3 py-2 min-h-[44px]"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value) || 4)}
            />
          </label>
          <label className="block text-sm">
            口コミ件数（目安）
            <input
              type="number"
              className="mt-1 w-full rounded-xl border px-3 py-2 min-h-[44px]"
              value={reviewCount}
              onChange={(e) => setReviewCount(Number(e.target.value) || 0)}
            />
          </label>
          <textarea
            className="w-full rounded-xl border px-3 py-3 min-h-[100px] text-sm"
            placeholder="口コミ本文（例: 味は美味しいが提供が遅い、写真と盛り付けが違う…）"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
          />
          <Button variant="secondary" fullWidth onClick={autoFillFromText} disabled={!rawText.trim()}>
            本文から8軸を自動分類
          </Button>

          <div className="space-y-3 rounded-lg bg-white border border-emerald-100 p-3">
            <p className="text-xs font-bold text-emerald-900">8軸分類（1=低い 〜 5=高い）</p>
            {REVIEW_DIMENSION_KEYS.map((key) => (
              <label key={key} className="block text-xs">
                <span className="text-slate-700 font-medium">{REVIEW_DIMENSION_LABELS[key]}</span>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="range"
                    min={1}
                    max={5}
                    step={0.5}
                    className="flex-1"
                    value={manualDims[key] ?? 3}
                    onChange={(e) => setDim(key, Number(e.target.value))}
                  />
                  <span className="w-8 text-right font-bold text-emerald-800">{manualDims[key] ?? '—'}</span>
                </div>
              </label>
            ))}
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" fullWidth onClick={runPreview}>
              プレビュー
            </Button>
            <Button fullWidth onClick={() => void save()} disabled={!rawText.trim() && !REVIEW_DIMENSION_KEYS.some((k) => manualDims[k] != null)}>
              保存
            </Button>
          </div>

          {preview && (
            <div className="rounded-lg bg-white p-3 text-xs space-y-2 border border-emerald-100">
              <p className="font-bold text-emerald-800">デリバリー適性: {preview.deliveryFit}</p>
              <p className="text-slate-600 leading-relaxed">{preview.deliveryFitNote}</p>
              <p className="text-slate-500">{preview.summary}</p>
              <div className="grid grid-cols-2 gap-1">
                {REVIEW_DIMENSION_KEYS.map((k) => {
                  const v = dimensionPreview[k];
                  if (v == null) return null;
                  return (
                    <span key={k} className="text-[10px] bg-emerald-50 px-2 py-1 rounded">
                      {REVIEW_DIMENSION_LABELS[k]}: {v}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {existing.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">登録済み ({existing.length})</p>
              {existing.map((r) => {
                normalizeReviewDimensions(r.dimensions);
                return (
                  <div key={r.id} className="flex justify-between items-start gap-2 text-xs bg-white rounded p-2 mb-1 border border-emerald-50">
                    <div>
                      <span className="font-medium">★{r.rating}</span>
                      <span className="ml-2 text-emerald-700">{r.deliveryFit}</span>
                      <p className="text-slate-500 mt-0.5 line-clamp-1">{r.summary}</p>
                    </div>
                    <Button size="sm" variant="danger" onClick={() => void removeStoreReview(r.id)}>
                      削除
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
