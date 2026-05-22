import { Card } from '@/components/ui/Card';
import type { RagEvidence } from '@/data/rag/types';

interface RagEvidencePanelProps {
  evidence: RagEvidence;
}

function EmptyHint({ text }: { text: string }) {
  return <p className="text-xs text-slate-400 italic mt-1">{text}</p>;
}

export function RagEvidencePanel({ evidence }: RagEvidencePanelProps) {
  const {
    benchmarkRef,
    comparedMetricLabels,
    knowledgeRefs,
    salesLogRefs,
    objectionRefs,
    reviewRefs,
    trustMetrics,
    reviewInsight,
    googleMapsRef,
    googleMapsProposals,
  } = evidence;

  return (
    <Card className="border-violet-200 bg-violet-50/40">
      <h3 className="font-bold text-violet-900">分析の根拠</h3>
      <p className="text-xs text-violet-800/80 mt-1">
        店舗責任者が確認できる参照元です。断定ではなく「傾向」「比較上」の参考情報として記載しています。
      </p>

      <section className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-white border border-violet-100 p-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase">参照店舗数</p>
          <p className="text-lg font-bold text-violet-900">{trustMetrics.referenceStoreCount}店</p>
        </div>
        <div className="rounded-lg bg-white border border-violet-100 p-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase">一致率（参考）</p>
          <p className="text-lg font-bold text-violet-900">{trustMetrics.matchRatePercent}%</p>
        </div>
        <div className="rounded-lg bg-white border border-violet-100 p-2 col-span-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase">比較条件</p>
          <p className="text-sm font-medium text-slate-800">{trustMetrics.comparisonConditions}</p>
        </div>
        <div className="rounded-lg bg-white border border-violet-100 p-2 col-span-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase">データ鮮度</p>
          <p className="text-sm text-slate-700">
            {trustMetrics.dataFreshnessLabel}
            <span className="text-slate-400 ml-1">（基準日 {trustMetrics.dataFreshnessDate}）</span>
          </p>
        </div>
      </section>

      {/* 1. 参照ベンチマーク — 常時表示 */}
      <section className="mt-4 rounded-lg bg-white/90 border border-violet-100 p-3">
        <h4 className="text-xs font-bold text-violet-900 uppercase tracking-wide">参照ベンチマーク</h4>
        <p className="text-sm text-slate-800 mt-1">{benchmarkRef.label}</p>
        <p className="text-xs text-slate-500 mt-0.5">
          サンプル {benchmarkRef.sampleSize}店 · 一致度 {benchmarkRef.matchLevel}
        </p>
        <p className="text-xs text-slate-600 mt-1">{benchmarkRef.sourceNote}</p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {comparedMetricLabels.map((m) => (
            <span key={m} className="text-[10px] bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-full text-violet-800">
              {m}
            </span>
          ))}
        </div>
      </section>

      {/* 2. Google Maps — 常時表示 */}
      <section className="mt-3 rounded-lg bg-white/90 border border-blue-200 p-3">
        <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wide">Google Maps情報</h4>
        <p className="text-[10px] text-blue-700 mt-0.5">
          データ状態: <span className="font-semibold">{googleMapsRef.dataStatusLabel}</span>
        </p>
        {googleMapsRef.dataStatus !== 'unconfirmed' ? (
          <dl className="mt-2 text-xs space-y-1 text-slate-700">
            {googleMapsRef.mapsUrl !== '—' && (
              <div>
                <dt className="text-slate-500 inline">URL: </dt>
                <dd className="inline break-all text-blue-700">{googleMapsRef.mapsUrl}</dd>
              </div>
            )}
            <div>
              <span className="text-slate-500">評価 </span>
              <span className="font-medium">★{googleMapsRef.rating}</span>
              <span className="text-slate-500 ml-2">口コミ {googleMapsRef.reviewCount}件</span>
            </div>
            <div>
              <span className="text-slate-500">営業時間 </span>
              {googleMapsRef.hours}
            </div>
            <div>
              <span className="text-slate-500">ジャンル </span>
              {googleMapsRef.genre}
            </div>
            {googleMapsRef.referencedReviews !== '（未入力）' && (
              <div>
                <dt className="text-slate-500">参照した口コミ</dt>
                <dd className="mt-0.5 leading-relaxed">{googleMapsRef.referencedReviews}</dd>
              </div>
            )}
            {googleMapsRef.positiveTrend !== '—' && (
              <div className="text-emerald-800">＋ {googleMapsRef.positiveTrend}</div>
            )}
            {googleMapsRef.negativeTrend !== '—' && (
              <div className="text-amber-800">− {googleMapsRef.negativeTrend}</div>
            )}
          </dl>
        ) : (
          <EmptyHint text="Google Maps情報は未確認です。上の「Google Maps情報」から手入力してください。" />
        )}
        {googleMapsProposals.length > 0 && (
          <ul className="mt-2 space-y-1 border-t border-blue-100 pt-2">
            {googleMapsProposals.map((p, i) => (
              <li key={i} className="text-xs text-slate-700 leading-relaxed">
                · {p}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 3. 参照口コミ — 常時表示 */}
      <section className="mt-3 rounded-lg bg-white/90 border border-emerald-100 p-3">
        <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wide">参照口コミ</h4>
        {reviewInsight ? (
          <>
            <p className="text-sm font-semibold text-emerald-800 mt-1">
              デリバリー適性: {reviewInsight.deliveryFitLabel}
            </p>
            <p className="text-xs text-emerald-900/90 mt-1 leading-relaxed">{reviewInsight.contrastSummary}</p>
            <div className="grid grid-cols-2 gap-1 mt-2">
              {reviewInsight.dimensionRows.map((d) => (
                <span
                  key={d.label}
                  className={`text-[10px] px-2 py-0.5 rounded ${
                    d.tone === 'positive'
                      ? 'bg-emerald-100 text-emerald-900'
                      : d.tone === 'negative'
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {d.label} {d.score ?? '—'}
                </span>
              ))}
            </div>
            {reviewInsight.proposalSentences.length > 0 && (
              <ul className="mt-2 space-y-1">
                {reviewInsight.proposalSentences.map((p, i) => (
                  <li key={i} className="text-xs text-slate-700 leading-relaxed">
                    · {p}
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : reviewRefs.length > 0 ? (
          <ul className="mt-1 space-y-1">
            {reviewRefs.map((r) => (
              <li key={r.id} className="text-xs text-slate-600">
                {r.rating && <span className="font-medium">★{r.rating} </span>}
                {r.excerpt}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyHint text="口コミ未登録。店舗詳細の「口コミを登録」から追加すると、提案の根拠が強化されます。" />
        )}
      </section>

      {/* 3. 参照営業履歴 — 常時表示 */}
      <section className="mt-3 rounded-lg bg-white/90 border border-slate-200 p-3">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">参照営業履歴</h4>
        {salesLogRefs.length > 0 ? (
          <ul className="mt-1 space-y-2">
            {salesLogRefs.map((s) => (
              <li key={s.id} className="text-sm border-b border-slate-100 pb-2 last:border-0">
                <span className="font-medium text-slate-800">{s.date}</span>
                {s.outcome && (
                  <span className="text-[10px] ml-2 bg-slate-100 px-1.5 py-0.5 rounded">{s.outcome}</span>
                )}
                <p className="text-xs text-slate-600 mt-0.5">{s.excerpt}</p>
                {s.hitProposal && (
                  <p className="text-xs text-emerald-700 mt-0.5">刺さった: {s.hitProposal}</p>
                )}
                {s.nextAction && <p className="text-xs text-violet-700">次回: {s.nextAction}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyHint text="営業履歴未登録。営業画面の「詳細営業履歴」から記録してください。" />
        )}
      </section>

      {/* 4. 参照ナレッジ — 常時表示 */}
      <section className="mt-3 rounded-lg bg-white/90 border border-violet-100 p-3">
        <h4 className="text-xs font-bold text-violet-900 uppercase tracking-wide">参照ナレッジ</h4>
        {knowledgeRefs.length > 0 ? (
          <ul className="mt-1 space-y-2">
            {knowledgeRefs.map((k) => (
              <li key={k.id} className="text-sm">
                <span className="font-medium text-violet-900">{k.title}</span>
                <span className="text-[10px] text-slate-400 ml-2">関連度 {k.relevance}%</span>
                <p className="text-xs text-slate-600 mt-0.5">{k.excerpt}</p>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyHint text="関連ナレッジのヒットなし（ナレッジDBを拡充すると精度が上がります）。" />
        )}
        {objectionRefs.length > 0 && (
          <div className="mt-3 pt-2 border-t border-amber-100">
            <p className="text-[10px] font-bold text-amber-800">断り文句 → 成功事例ベースの提案</p>
            <ul className="mt-1 space-y-2">
              {objectionRefs.map((o) => (
                <li key={o.id} className="text-xs">
                  <span className="font-medium text-amber-900">{o.objection}</span>
                  {o.suggestions && o.suggestions.length > 0 && (
                    <ul className="list-disc list-inside text-amber-900 mt-0.5">
                      {o.suggestions.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* 5. データ信頼度 — 常時表示 */}
      <section className="mt-3 rounded-lg bg-white/90 border border-violet-200 p-3">
        <h4 className="text-xs font-bold text-violet-900 uppercase tracking-wide">データ信頼度</h4>
        <p className="text-sm font-medium text-violet-900 mt-1">{evidence.dataConfidenceNote}</p>
        <p className="text-xs text-slate-500 mt-1">{evidence.retrievalSummary}</p>
      </section>
    </Card>
  );
}
