import { useData } from '@/context/DataContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { ServiceBadge } from '@/components/ui/ServiceBadge';
import { Button } from '@/components/ui/Button';
import { Link } from 'react-router-dom';
import { uid } from '@/lib/utils';
import type { ServiceId } from '@/data/types';

export function CampaignsPage() {
  const { data, update } = useData();

  const addCampaign = () => {
    const title = prompt('キャンペーン名');
    if (!title) return;
    void update((prev) => ({
      ...prev,
      campaigns: [
        {
          id: uid(),
          title,
          serviceId: 'uber_eats' as ServiceId,
          startDate: new Date().toISOString().slice(0, 10),
          endDate: new Date().toISOString().slice(0, 10),
          description: '',
          targetAreas: [],
          active: true,
        },
        ...prev.campaigns,
      ],
    }));
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="キャンペーン管理"
        subtitle="4社のプロモ情報"
        action={
          <Button size="sm" onClick={addCampaign}>
            + 追加
          </Button>
        }
      />
      <Link to="/" className="text-sm text-indigo-600">← ホーム</Link>

      {data.campaigns.map((c) => (
        <Card key={c.id} accent={c.active ? '#f59e0b' : '#94a3b8'}>
          <div className="flex justify-between items-start gap-2">
            <div>
              <ServiceBadge id={c.serviceId} small />
              <h3 className="font-bold text-slate-900 mt-2">{c.title}</h3>
              <p className="text-sm text-slate-500 mt-1">
                {c.startDate} 〜 {c.endDate}
              </p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${c.active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
              {c.active ? '実施中' : '終了'}
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-2">{c.description}</p>
          {c.targetAreas.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {c.targetAreas.map((a) => (
                <span key={a} className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                  {a}
                </span>
              ))}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
