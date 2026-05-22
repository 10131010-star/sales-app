import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { StoreAnalysisReport } from '@/components/StoreAnalysisReport';
import { StoreFormModal } from '@/components/StoreFormModal';
import { GoogleMapsInfoForm } from '@/components/GoogleMapsInfoForm';
import { StoreReviewForm } from '@/components/StoreReviewForm';
import { OSAKA_AREAS, STORE_TYPES, memberName } from '@/data/constants';
import type { StoreAnalysisInput } from '@/data/analysis/types';
import type { StoreAnalysisWithRag } from '@/data/rag/types';
import { defaultAnalysisInputFromStore } from '@/lib/analysis/engine';
import { runStoreAnalysisWithRag } from '@/lib/analysis/ragAnalysis';
import { loadStoreAnalysisInput, saveStoreAnalysisInput } from '@/lib/analysis/storeProfileStorage';

export function StoreDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, saveStore, removeStore } = useData();
  const [result, setResult] = useState<StoreAnalysisWithRag | null>(null);
  const [ragLoading, setRagLoading] = useState(false);
  const store = data.stores.find((s) => s.id === id);
  const [editOpen, setEditOpen] = useState(false);
  const [salesOpen, setSalesOpen] = useState(false);
  const [dataOpen, setDataOpen] = useState(false);
  const [input, setInput] = useState<StoreAnalysisInput | null>(null);
  const [gmapsRevision, setGmapsRevision] = useState(0);

  useEffect(() => {
    if (!store) return;
    const saved = loadStoreAnalysisInput(store.id);
    setInput(saved ?? defaultAnalysisInputFromStore(store));
  }, [store?.id]);

  useEffect(() => {
    if (!input || !store) return;
    let cancelled = false;
    setRagLoading(true);
    const analysisInput: StoreAnalysisInput = {
      ...input,
      name: store.name,
      area: store.area || input.area,
      businessType: store.businessType || input.businessType,
      linkedStoreId: store.id,
    };
    void runStoreAnalysisWithRag(data, analysisInput)
      .then((r) => {
        if (!cancelled) setResult(r);
      })
      .finally(() => {
        if (!cancelled) setRagLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [input, store, data, gmapsRevision]);

  const patchInput = useCallback(
    (partial: Partial<StoreAnalysisInput>) => {
      if (!store) return;
      setInput((prev) => {
        const next = { ...(prev ?? defaultAnalysisInputFromStore(store)), ...partial };
        saveStoreAnalysisInput(store.id, next);
        return next;
      });
    },
    [store],
  );

  const patchConfidence = useCallback(
    (key: keyof StoreAnalysisInput['confidence'], value: boolean) => {
      if (!input) return;
      patchInput({ confidence: { ...input.confidence, [key]: value } });
    },
    [input, patchInput],
  );

  if (!store || !input) {
    return <p className="text-slate-500 p-4">読み込み中...</p>;
  }

  if (ragLoading && !result) {
    return <p className="text-slate-500 p-4">分析データを検索中（RAG）...</p>;
  }

  if (!result) {
    return <p className="text-slate-500 p-4">分析を準備中...</p>;
  }

  const handleSave = async (form: typeof store) => {
    await saveStore({ ...form, updatedAt: new Date().toISOString() });
    setEditOpen(false);
    patchInput({
      name: form.name,
      area: form.area,
      businessType: form.businessType,
    });
  };

  return (
    <div className="space-y-4 pb-8">
      <header className="flex justify-between items-start gap-2">
        <div>
          <p className="text-xs font-semibold text-violet-600 uppercase tracking-wide">店舗分析AIレポート（RAG）</p>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">{store.name}</h1>
          <p className="text-sm text-slate-500">{store.area} · {store.businessType}</p>
        </div>
        <Button size="sm" variant="ghost" onClick={() => navigate(-1)}>
          戻る
        </Button>
      </header>

      <StoreAnalysisReport result={result} />

      <GoogleMapsInfoForm store={store} onSaved={() => setGmapsRevision((n) => n + 1)} />

      <StoreReviewForm store={store} />

      <Card>
        <button
          type="button"
          className="w-full flex justify-between items-center text-left min-h-[48px]"
          onClick={() => setDataOpen(!dataOpen)}
        >
          <span className="font-bold text-slate-900">分析データを調整</span>
          <span className="text-slate-400">{dataOpen ? '▲' : '▼'}</span>
        </button>
        {dataOpen && (
          <div className="mt-4 space-y-3 border-t pt-4">
            <p className="text-xs text-slate-500">数値を変えるとレポートが即時再計算されます（上位店比較ベース）</p>
            <label className="block text-sm">
              <span className="text-slate-600">平均単価（円）</span>
              <input
                type="number"
                className="mt-1 w-full rounded-xl border px-3 py-3 min-h-[48px]"
                value={input.avgUnitPrice}
                onChange={(e) => patchInput({ avgUnitPrice: Number(e.target.value) || 0 })}
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-600">商品数</span>
              <input
                type="number"
                className="mt-1 w-full rounded-xl border px-3 py-3 min-h-[48px]"
                value={input.productCount}
                onChange={(e) => patchInput({ productCount: Number(e.target.value) || 0 })}
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-600">セット率 {input.setRate}%</span>
              <input
                type="range"
                min={0}
                max={100}
                className="w-full mt-1"
                value={input.setRate}
                onChange={(e) => patchInput({ setRate: Number(e.target.value) })}
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-600">深夜営業率 {input.lateNightRate}%</span>
              <input
                type="range"
                min={0}
                max={100}
                className="w-full mt-1"
                value={input.lateNightRate}
                onChange={(e) => patchInput({ lateNightRate: Number(e.target.value) })}
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-600">レビュー平均</span>
              <input
                type="number"
                step={0.1}
                min={0}
                max={5}
                className="mt-1 w-full rounded-xl border px-3 py-3 min-h-[48px]"
                value={input.reviewScore}
                onChange={(e) => patchInput({ reviewScore: Number(e.target.value) || 0 })}
              />
            </label>
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">エリア</p>
              <div className="flex flex-wrap gap-1">
                {OSAKA_AREAS.slice(0, 8).map((a) => (
                  <Chip key={a} label={a} active={input.area === a} onClick={() => patchInput({ area: a })} />
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">業態</p>
              <div className="flex flex-wrap gap-1">
                {STORE_TYPES.slice(0, 8).map((t) => (
                  <Chip key={t} label={t} active={input.businessType === t} onClick={() => patchInput({ businessType: t })} />
                ))}
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500">データ信頼度チェック</p>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ['googleMaps', 'Google Maps'],
                  ['uberSearch', 'Uber検索'],
                  ['reviewCheck', '口コミ'],
                  ['photoCheck', '写真'],
                  ['siteVisit', '現地確認'],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm min-h-[44px]">
                  <input
                    type="checkbox"
                    className="w-5 h-5"
                    checked={input.confidence[key]}
                    onChange={(e) => patchConfidence(key, e.target.checked)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        )}
      </Card>

      <div className="flex gap-2">
        <Button
          fullWidth
          variant="secondary"
          onClick={() => {
            const text = [
              `【${store.name}】デリバリー導入 分析レポート`,
              `総合スコア: ${result.overallScore} / 100`,
              '',
              result.ownerNarrative,
              '',
              '■ 強み',
              ...result.strengths.map((s) => `・${s}`),
            ].join('\n');
            void navigator.clipboard.writeText(text);
          }}
        >
          レポートをコピー
        </Button>
        <Link to={`/sales?store=${store.id}`} className="flex-1">
          <Button fullWidth variant="ghost">
            営業入力
          </Button>
        </Link>
      </div>

      <Card className="border-dashed border-slate-300 bg-slate-50/50">
        <button
          type="button"
          className="w-full flex justify-between items-center text-left min-h-[44px]"
          onClick={() => setSalesOpen(!salesOpen)}
        >
          <span className="text-sm font-semibold text-slate-600">営業管理・メモ（サブ）</span>
          <span className="text-slate-400 text-sm">{salesOpen ? '閉じる' : '開く'}</span>
        </button>
        {salesOpen && (
          <div className="mt-3 pt-3 border-t border-slate-200 space-y-3 text-sm">
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-slate-500">担当</dt>
                <dd className="font-medium">{memberName(store.assigneeId)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">導入状況</dt>
                <dd>{store.adoptionStatus}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">優先度</dt>
                <dd>{store.priority}</dd>
              </div>
              <div>
                <dt className="text-slate-500">次回アクション</dt>
                <dd className="text-violet-700 mt-0.5">{store.nextAction || '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">営業メモ</dt>
                <dd className="whitespace-pre-wrap mt-0.5 text-slate-700">{store.salesMemo || '—'}</dd>
              </div>
            </dl>
            <div className="flex gap-2 pt-2">
              <Button size="sm" variant="secondary" fullWidth onClick={() => setEditOpen(true)}>
                店舗情報を編集
              </Button>
              <Button
                size="sm"
                variant="danger"
                fullWidth
                onClick={() => {
                  if (confirm('削除しますか？')) {
                    void removeStore(store.id);
                    navigate('/stores');
                  }
                }}
              >
                削除
              </Button>
            </div>
          </div>
        )}
      </Card>

      <StoreFormModal
        open={editOpen}
        initial={store}
        defaultAssignee={store.assigneeId}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
