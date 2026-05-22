import { Card } from '@/components/ui/Card';
import { RagEvidencePanel } from '@/components/RagEvidencePanel';
import type { StoreAnalysisInput, StoreAnalysisResult } from '@/data/analysis/types';
import type { StoreAnalysisWithRag } from '@/data/rag/types';
import { formatMetricValue } from '@/lib/analysis/engine';

const CONFIDENCE_ITEMS: { key: keyof StoreAnalysisInput['confidence']; label: string }[] = [
  { key: 'googleMaps', label: 'Google Maps' },
  { key: 'uberSearch', label: 'Uber検索' },
  { key: 'reviewCheck', label: '口コミ' },
  { key: 'photoCheck', label: '写真' },
  { key: 'siteVisit', label: '現地確認' },
];

const METRIC_DISPLAY: Record<string, string> = {
  avgUnitPrice: '単価',
  productCount: '商品数',
  setRate: 'セット率',
  lateNightRate: '深夜営業',
  reviewScore: 'レビュー',
};

function positionBadge(pos: 'above' | 'similar' | 'below') {
  if (pos === 'above') return <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">上位超え</span>;
  if (pos === 'below') return <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">上位未満</span>;
  return <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">同程度</span>;
}

function scoreColor(score: number): string {
  if (score >= 75) return '#10b981';
  if (score >= 55) return '#f59e0b';
  return '#94a3b8';
}

interface StoreAnalysisReportProps {
  result: StoreAnalysisResult | StoreAnalysisWithRag;
  compact?: boolean;
}

function hasRag(result: StoreAnalysisResult): result is StoreAnalysisWithRag {
  return 'ragEvidence' in result && result.ragEvidence != null;
}

export function StoreAnalysisReport({ result, compact }: StoreAnalysisReportProps) {
  const { overallScore, categoryScores, metrics, input } = result;
  const ragEvidence = hasRag(result) ? result.ragEvidence : null;

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-violet-600 via-indigo-600 to-violet-800 text-white border-0 overflow-hidden">
        <p className="text-xs font-semibold uppercase tracking-wider opacity-80">総合分析スコア</p>
        <div className="flex items-end gap-2 mt-2">
          <span className="text-6xl font-black leading-none">{overallScore}</span>
          <span className="text-2xl font-bold opacity-70 pb-2">/ 100点</span>
        </div>
        <p className="text-sm mt-3 opacity-90 leading-relaxed">{result.overallSummary}</p>
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="text-xs bg-white/20 px-3 py-1 rounded-full">
            導入余地（参考）: {result.adoptionPotential}
          </span>
          <span className="text-xs bg-white/20 px-3 py-1 rounded-full">
            信頼度 {result.confidenceLabel} {result.confidencePercent}%
          </span>
        </div>
      </Card>

      <Card>
        <h3 className="font-bold text-slate-900 mb-3">分析項目スコア</h3>
        <p className="text-xs text-slate-500 mb-3">上位店比較から算出（断定ではありません）</p>
        <div className="grid grid-cols-1 gap-3">
          {categoryScores.map((c) => (
            <div key={c.key} className="rounded-xl border border-slate-100 p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-slate-800">{c.label}</span>
                <span className="text-xl font-bold" style={{ color: scoreColor(c.score) }}>
                  {c.score}
                  <span className="text-sm font-normal text-slate-400">点</span>
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${c.score}%`, backgroundColor: scoreColor(c.score) }}
                />
              </div>
              {!compact && (
                <>
                  <p className="text-xs text-slate-600 mt-2">{c.summary}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{c.basis}</p>
                </>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="font-bold text-slate-900 mb-1">上位店舗平均との比較</h3>
        <p className="text-xs text-slate-500 mb-3">{result.benchmarkLabel}</p>
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm min-w-[300px]">
            <thead>
              <tr className="text-left text-slate-500 border-b text-xs">
                <th className="py-2 pr-2">項目</th>
                <th className="py-2 pr-2 text-right">この店</th>
                <th className="py-2 pr-2 text-right">上位平均</th>
                {!compact && <th className="py-2">分析</th>}
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => (
                <tr key={m.key} className="border-b border-slate-50 align-top">
                  <td className="py-3 pr-2">
                    <span className="font-medium">{METRIC_DISPLAY[m.key] ?? m.label}</span>
                    <div className="mt-1">{positionBadge(m.position)}</div>
                  </td>
                  <td className="py-3 pr-2 text-right font-bold text-violet-700 whitespace-nowrap">
                    {formatMetricValue(m.key, m.storeValue)}
                  </td>
                  <td className="py-3 pr-2 text-right text-slate-600 whitespace-nowrap">
                    {formatMetricValue(m.key, m.benchmarkValue)}
                  </td>
                  {!compact && (
                    <td className="py-3 text-xs text-slate-600 leading-relaxed max-w-[140px]">
                      {m.analysis}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="bg-indigo-50/80 border-indigo-100">
        <h3 className="font-bold text-indigo-900 mb-2">店舗責任者向け説明</h3>
        <p className="text-sm text-indigo-950 leading-relaxed whitespace-pre-wrap">
          {result.ownerNarrative}
        </p>
      </Card>

      <Card accent="#10b981">
        <h3 className="font-bold text-emerald-900">強み</h3>
        <ul className="mt-2 space-y-2">
          {result.strengths.map((s, i) => (
            <li key={i} className="text-sm text-emerald-900 flex gap-2">
              <span className="shrink-0">✓</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card accent="#f59e0b">
        <h3 className="font-bold text-amber-900">懸念点</h3>
        <ul className="mt-2 space-y-2">
          {result.concerns.map((c, i) => (
            <li key={i} className="text-sm text-amber-900 flex gap-2">
              <span className="shrink-0">!</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </Card>

      {'googleMapsProposals' in result && (result.googleMapsProposals?.length ?? 0) > 0 && (
        <Card className="bg-blue-50/80 border-blue-200">
          <h3 className="font-bold text-blue-900">Google Maps根拠に基づく提案</h3>
          <p className="text-xs text-blue-800/80 mt-1">Google Maps上の口コミ傾向から見ると（参考）</p>
          <ul className="mt-2 space-y-2">
            {(result as StoreAnalysisWithRag).googleMapsProposals!.map((p, i) => (
              <li key={i} className="text-sm text-blue-950 leading-relaxed flex gap-2">
                <span className="shrink-0 text-blue-600">◎</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {'reviewBasedProposals' in result && (result.reviewBasedProposals?.length ?? 0) > 0 && (
        <Card className="bg-emerald-50/80 border-emerald-200">
          <h3 className="font-bold text-emerald-900">口コミ根拠に基づく提案</h3>
          <p className="text-xs text-emerald-800/80 mt-1">口コミ傾向から見ると、次の進め方に改善余地があります（参考）</p>
          <ul className="mt-2 space-y-2">
            {(result as StoreAnalysisWithRag).reviewBasedProposals!.map((p, i) => (
              <li key={i} className="text-sm text-emerald-950 leading-relaxed flex gap-2">
                <span className="shrink-0 text-emerald-600">◎</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {ragEvidence && !compact && <RagEvidencePanel evidence={ragEvidence} />}

      <Card accent="#6366f1">
        <h3 className="font-bold text-indigo-900">改善提案</h3>
        <ul className="mt-2 space-y-2">
          {result.recommendations.map((r, i) => (
            <li key={i} className="text-sm text-indigo-900 flex gap-2">
              <span className="shrink-0">→</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h3 className="font-bold text-slate-900 mb-3">データ信頼度</h3>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="text-3xl font-bold"
            style={{ color: scoreColor(result.confidencePercent) }}
          >
            {result.confidencePercent}%
          </div>
          <span className="text-sm text-slate-600">（{result.confidenceLabel}）</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {CONFIDENCE_ITEMS.map(({ key, label }) => (
            <div
              key={key}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm min-h-[44px] ${
                input.confidence[key]
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-50 text-slate-400 border border-slate-100'
              }`}
            >
              <span>{input.confidence[key] ? '✓' : '—'}</span>
              {label}
            </div>
          ))}
        </div>
      </Card>

      <Card className="bg-slate-50 border-slate-200">
        <h3 className="font-bold text-slate-900 mb-2">なぜそう分析したか</h3>
        <ul className="space-y-2">
          {result.analysisReasons.map((r, i) => (
            <li key={i} className="text-xs text-slate-600 flex gap-2 leading-relaxed">
              <span className="text-violet-500 shrink-0">•</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
        <p className="text-[11px] text-slate-400 mt-3 border-t pt-2">
          更新: {new Date(result.analyzedAt).toLocaleString('ja-JP')} · {result.benchmark.dataSourceNote}
        </p>
      </Card>
    </div>
  );
}
