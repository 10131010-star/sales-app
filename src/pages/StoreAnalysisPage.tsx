import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '@/context/DataContext';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { OSAKA_AREAS, STORE_TYPES } from '@/data/constants';
import type { StoreAnalysisInput } from '@/data/analysis/types';
import type { StoreAnalysisWithRag } from '@/data/rag/types';
import { StoreAnalysisReport } from '@/components/StoreAnalysisReport';
import { runStoreAnalysisWithRag } from '@/lib/analysis/ragAnalysis';
import { resolveBenchmarkFromInput } from '@/data/analysis/benchmarks';
import { inferBenchmarkSegment } from '@/data/analysis/segment';

const DEFAULT_INPUT = (): StoreAnalysisInput => ({
  name: '',
  area: '難波',
  businessType: '韓国料理',
  avgUnitPrice: 1200,
  productCount: 20,
  setRate: 40,
  lateNightRate: 30,
  reviewScore: 3.8,
  confidence: {
    googleMaps: false,
    uberSearch: false,
    reviewCheck: false,
    photoCheck: false,
    siteVisit: false,
  },
});

const CONFIDENCE_LABELS: { key: keyof StoreAnalysisInput['confidence']; label: string }[] = [
  { key: 'googleMaps', label: 'Google Maps確認' },
  { key: 'uberSearch', label: 'Uber検索確認' },
  { key: 'reviewCheck', label: '口コミ確認' },
  { key: 'photoCheck', label: '写真確認' },
  { key: 'siteVisit', label: '現地確認' },
];

export function StoreAnalysisPage() {
  const { data } = useData();
  const [input, setInput] = useState<StoreAnalysisInput>(DEFAULT_INPUT);
  const [result, setResult] = useState<StoreAnalysisWithRag | null>(null);
  const [linkedStoreId, setLinkedStoreId] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  const previewBench = useMemo(() => {
    const segment = inferBenchmarkSegment(input);
    const { profile, matchLevel } = resolveBenchmarkFromInput(input, segment);
    return { profile, matchLevel };
  }, [input.area, input.businessType]);

  const patch = (partial: Partial<StoreAnalysisInput>) => setInput((p) => ({ ...p, ...partial }));

  const loadFromStore = (storeId: string) => {
    const s = data.stores.find((x) => x.id === storeId);
    if (!s) return;
    setLinkedStoreId(storeId);
    patch({
      name: s.name,
      area: s.area || input.area,
      businessType: STORE_TYPES.includes(s.businessType as (typeof STORE_TYPES)[number])
        ? s.businessType
        : input.businessType,
      linkedStoreId: storeId,
    });
  };

  const runAnalysis = async () => {
    if (!input.name.trim()) {
      alert('店舗名を入力してください');
      return;
    }
    setAnalyzing(true);
    try {
      const analysis = await runStoreAnalysisWithRag(data, {
        ...input,
        linkedStoreId: linkedStoreId || undefined,
      });
      setResult(analysis);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => {
    setResult(null);
    setInput(DEFAULT_INPUT());
    setLinkedStoreId('');
  };

  return (
    <div className="space-y-4 pb-8">
      <header>
        <Link to="/" className="text-sm text-violet-600 font-medium">← ホーム</Link>
        <p className="text-sm text-violet-600 font-semibold mt-2">店舗分析AI</p>
        <h1 className="text-2xl font-bold text-slate-900">上位店舗比較レポート</h1>
        <p className="text-sm text-slate-500 mt-1">
          外部APIなし。登録データ（ベンチマーク・ナレッジ・営業履歴）をRAG検索し、必要な情報だけ参照して比較分析します。
        </p>
      </header>

      {!result && (
        <>
          <Card accent="#6366f1" className="bg-indigo-50/50">
            <p className="text-sm font-semibold text-indigo-900">ベンチマークプレビュー</p>
            <p className="text-sm text-indigo-800 mt-1">
              {input.area} · {input.businessType}
              {(previewBench.matchLevel === 'exact' || previewBench.matchLevel === 'segment') && (
                <span className="ml-1 text-xs bg-indigo-200 px-2 py-0.5 rounded-full">
                  専用データ（{previewBench.profile.sampleSize}店）
                  {previewBench.profile.segmentLabel ? ` · ${previewBench.profile.segmentLabel}` : ''}
                </span>
              )}
              {previewBench.matchLevel !== 'exact' && previewBench.matchLevel !== 'segment' && (
                <span className="ml-1 text-xs bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                  参考値（{previewBench.matchLevel === 'business' ? '業態平均' : '広域'}）
                </span>
              )}
            </p>
            <p className="text-xs text-slate-600 mt-2">
              平均単価 ¥{previewBench.profile.avgUnitPrice.toLocaleString()} · 商品{previewBench.profile.avgProductCount}品 · セット{previewBench.profile.avgSetRate}% · 深夜{previewBench.profile.avgLateNightRate}% · ★{previewBench.profile.avgReviewScore}
            </p>
          </Card>

          {data.stores.length > 0 && (
            <Card>
              <label className="text-sm font-medium text-slate-600">店舗カルテから読み込み（任意）</label>
              <select
                className="mt-1 w-full rounded-xl border px-3 py-3 min-h-[48px] text-base"
                value={linkedStoreId}
                onChange={(e) => {
                  setLinkedStoreId(e.target.value);
                  if (e.target.value) loadFromStore(e.target.value);
                }}
              >
                <option value="">選択しない</option>
                {data.stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}（{s.area}）
                  </option>
                ))}
              </select>
            </Card>
          )}

          <Card>
            <h2 className="font-bold text-slate-900 mb-3">店舗データ入力</h2>
            <div className="space-y-3">
              <input
                className="w-full rounded-xl border px-3 py-3 min-h-[48px]"
                placeholder="店舗名 *"
                value={input.name}
                onChange={(e) => patch({ name: e.target.value })}
              />
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">エリア</p>
                <div className="flex flex-wrap gap-1">
                  {OSAKA_AREAS.slice(0, 10).map((a) => (
                    <Chip key={a} label={a} active={input.area === a} onClick={() => patch({ area: a })} />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">業態</p>
                <div className="flex flex-wrap gap-1">
                  {STORE_TYPES.slice(0, 10).map((t) => (
                    <Chip key={t} label={t} active={input.businessType === t} onClick={() => patch({ businessType: t })} />
                  ))}
                </div>
              </div>

              <label className="block text-sm">
                <span className="text-slate-600">平均単価（円）</span>
                <input
                  type="number"
                  className="mt-1 w-full rounded-xl border px-3 py-3 min-h-[48px]"
                  value={input.avgUnitPrice}
                  onChange={(e) => patch({ avgUnitPrice: Number(e.target.value) || 0 })}
                />
              </label>
              <label className="block text-sm">
                <span className="text-slate-600">商品数（品）</span>
                <input
                  type="number"
                  className="mt-1 w-full rounded-xl border px-3 py-3 min-h-[48px]"
                  value={input.productCount}
                  onChange={(e) => patch({ productCount: Number(e.target.value) || 0 })}
                />
              </label>
              <label className="block text-sm">
                <span className="text-slate-600">セット率（%）</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  className="w-full mt-1"
                  value={input.setRate}
                  onChange={(e) => patch({ setRate: Number(e.target.value) })}
                />
                <span className="text-violet-700 font-bold">{input.setRate}%</span>
              </label>
              <label className="block text-sm">
                <span className="text-slate-600">深夜営業率（22時以降の対応・%）</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  className="w-full mt-1"
                  value={input.lateNightRate}
                  onChange={(e) => patch({ lateNightRate: Number(e.target.value) })}
                />
                <span className="text-violet-700 font-bold">{input.lateNightRate}%</span>
              </label>
              <label className="block text-sm">
                <span className="text-slate-600">レビュー平均（5点満点）</span>
                <input
                  type="number"
                  step={0.1}
                  min={0}
                  max={5}
                  className="mt-1 w-full rounded-xl border px-3 py-3 min-h-[48px]"
                  value={input.reviewScore}
                  onChange={(e) => patch({ reviewScore: Number(e.target.value) || 0 })}
                />
              </label>
            </div>
          </Card>

          <Card>
            <h2 className="font-bold text-slate-900 mb-3">データ信頼度</h2>
            <p className="text-xs text-slate-500 mb-3">確認した項目にチェック（分析の信頼度に反映）</p>
            <div className="space-y-2">
              {CONFIDENCE_LABELS.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 min-h-[44px] text-sm font-medium">
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded"
                    checked={input.confidence[key]}
                    onChange={(e) =>
                      patch({ confidence: { ...input.confidence, [key]: e.target.checked } })
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
          </Card>

          <Button fullWidth size="lg" onClick={() => void runAnalysis()} disabled={analyzing}>
            {analyzing ? '検索・分析中…' : '📊 上位店と比較して分析（RAG）'}
          </Button>
        </>
      )}

      {result && (
        <>
          <StoreAnalysisReport result={result} />

          <div className="flex gap-2">
            <Button fullWidth variant="secondary" onClick={reset}>
              別の店舗を分析
            </Button>
            <Button
              fullWidth
              variant="ghost"
              onClick={() => {
                const text = [
                  `【${result.input.name}】デリバリー導入参考レポート`,
                  result.overallSummary,
                  '',
                  '■ 導入余地',
                  result.report.adoptionBody,
                  '',
                  '■ 注意点',
                  ...result.report.cautions.map((c) => `・${c}`),
                ].join('\n');
                void navigator.clipboard.writeText(text);
              }}
            >
              コピー
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
