import { useState } from 'react';
import { useData } from '@/context/DataContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { ServiceBadge } from '@/components/ui/ServiceBadge';
import { SERVICE_LABELS } from '@/data/types';

type Tab = 'service' | 'fee' | 'ui';

export function ComparePage() {
  const { data } = useData();
  const [tab, setTab] = useState<Tab>('service');

  return (
    <div className="space-y-4">
      <PageHeader title="4社比較" subtitle="Uber Eats・出前館・menu・Rocket Now" />

      <div className="flex gap-2 overflow-x-auto pb-1">
        <Chip label="サービス" active={tab === 'service'} onClick={() => setTab('service')} />
        <Chip label="手数料" active={tab === 'fee'} onClick={() => setTab('fee')} />
        <Chip label="UI" active={tab === 'ui'} onClick={() => setTab('ui')} />
      </div>

      {tab === 'service' &&
        data.platforms.map((p) => (
          <Card key={p.serviceId}>
            <ServiceBadge id={p.serviceId} />
            <p className="mt-3 text-sm font-semibold text-slate-700">強み</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {p.strongAreas.map((a) => (
                <span key={a} className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
                  {a}
                </span>
              ))}
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-700">弱み</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {p.weakAreas.map((a) => (
                <span key={a} className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">
                  {a}
                </span>
              ))}
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-700">機能</p>
            <ul className="mt-1 list-disc pl-4 text-sm text-slate-600">
              {p.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-slate-400">{p.notes}</p>
          </Card>
        ))}

      {tab === 'fee' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="py-2">サービス</th>
                  <th className="py-2">手数料（%）</th>
                </tr>
              </thead>
              <tbody>
                {data.platforms.map((p) => (
                  <tr key={p.serviceId} className="border-b border-slate-100">
                    <td className="py-3 font-medium">{SERVICE_LABELS[p.serviceId]}</td>
                    <td className="py-3">
                      {p.commissionMin}〜{p.commissionMax}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-amber-700 bg-amber-50 rounded-lg p-2">
            ※ 手数料は契約・キャンペーンにより変動します。訪問前に最新情報を確認してください。
          </p>
        </Card>
      )}

      {tab === 'ui' && (
        <div className="space-y-3">
          {data.platforms.map((p) => (
            <Card key={p.serviceId}>
              <div className="flex items-center justify-between">
                <ServiceBadge id={p.serviceId} />
                <span className="text-2xl font-bold text-indigo-600">{p.uiScore}/5</span>
              </div>
              <div className="mt-2 h-3 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-500"
                  style={{ width: `${(p.uiScore / 5) * 100}%` }}
                />
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="bg-violet-50 border-violet-200">
        <p className="text-sm font-semibold text-violet-900">UI比較のポイント（営業用）</p>
        <ul className="mt-2 text-sm text-violet-800 space-y-1">
          <li>• 注文導線のわかりやすさ</li>
          <li>• 写真・メニュー編集のしやすさ</li>
          <li>• オーナー向け管理画面</li>
          <li>• 配達状況の見える化</li>
        </ul>
      </Card>
    </div>
  );
}
