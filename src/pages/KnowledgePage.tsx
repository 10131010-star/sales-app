import { useMemo, useState } from 'react';
import { useData } from '@/context/DataContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { uid } from '@/lib/utils';
import type { SalesScript } from '@/data/types';

type ScriptFilter = SalesScript['type'] | 'all' | 'pattern';

const TYPE_LABELS: Record<SalesScript['type'], string> = {
  talk: '営業トーク',
  objection: '断り文句',
  rebuttal: '切り返し',
  hook: '業態別フック',
  success: '成功事例',
  loss: '失注理由',
};

export function KnowledgePage() {
  const { data, update, currentMemberId } = useData();
  const [filter, setFilter] = useState<ScriptFilter>('all');
  const [bizFilter, setBizFilter] = useState('');

  const scripts = useMemo(() => {
    return data.scripts.filter((s) => {
      if (filter !== 'all' && filter !== 'pattern' && s.type !== filter) return false;
      if (bizFilter && s.businessTypes.length > 0 && !s.businessTypes.includes(bizFilter)) return false;
      return true;
    });
  }, [data.scripts, filter, bizFilter]);

  const addScript = (type: SalesScript['type']) => {
    const title = prompt('タイトル');
    if (!title) return;
    const content = prompt('内容') ?? '';
    void update((prev) => ({
      ...prev,
      scripts: [
        {
          id: uid(),
          type,
          title,
          content,
          businessTypes: bizFilter ? [bizFilter] : [],
          tags: [],
        },
        ...prev.scripts,
      ],
    }));
  };

  const addPattern = (type: 'win' | 'loss') => {
    const title = prompt('パターン名');
    if (!title) return;
    void update((prev) => ({
      ...prev,
      patterns: [
        {
          id: uid(),
          type,
          title,
          situation: '',
          action: '',
          result: '',
          businessType: bizFilter || 'その他',
          memberId: currentMemberId,
          createdAt: new Date().toISOString(),
        },
        ...prev.patterns,
      ],
    }));
  };

  return (
    <div className="space-y-4">
      <PageHeader title="ナレッジ" subtitle="トーク・断り文句・成功パターン" />

      <div className="flex gap-2 overflow-x-auto pb-1">
        <Chip label="すべて" active={filter === 'all'} onClick={() => setFilter('all')} />
        {(Object.keys(TYPE_LABELS) as SalesScript['type'][]).map((t) => (
          <Chip key={t} label={TYPE_LABELS[t]} active={filter === t} onClick={() => setFilter(t)} />
        ))}
        <Chip label="勝ち/負け" active={filter === 'pattern'} onClick={() => setFilter('pattern')} />
      </div>

      <div className="flex gap-2 flex-wrap">
        {['', 'ラーメン', '居酒屋', 'カレー', '弁当'].map((b) => (
          <Chip key={b || 'all'} label={b || '全業態'} active={bizFilter === b} onClick={() => setBizFilter(b)} />
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => addScript('talk')}>
          + トーク
        </Button>
        <Button size="sm" variant="secondary" onClick={() => addScript('objection')}>
          + 断り文句
        </Button>
        <Button size="sm" variant="secondary" onClick={() => addScript('rebuttal')}>
          + 切り返し
        </Button>
        <Button size="sm" variant="secondary" onClick={() => addPattern('win')}>
          + 勝ち
        </Button>
        <Button size="sm" variant="secondary" onClick={() => addPattern('loss')}>
          + 負け
        </Button>
      </div>

      {filter === 'pattern' ? (
        <div className="space-y-3">
          {data.patterns.map((p) => (
            <Card key={p.id} accent={p.type === 'win' ? '#10b981' : '#ef4444'}>
              <span className={`text-xs font-bold ${p.type === 'win' ? 'text-emerald-600' : 'text-red-600'}`}>
                {p.type === 'win' ? '勝ちパターン' : '負けパターン'}
              </span>
              <h3 className="font-bold text-slate-900 mt-1">{p.title}</h3>
              <p className="text-sm text-slate-600 mt-1">{p.businessType} · {data.members.find((m) => m.id === p.memberId)?.name}</p>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {scripts.map((s) => (
            <Card key={s.id}>
              <span className="text-xs font-medium text-indigo-600">{TYPE_LABELS[s.type]}</span>
              <h3 className="font-bold text-slate-900 mt-1">{s.title}</h3>
              <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">{s.content}</p>
              {s.businessTypes.length > 0 && (
                <div className="mt-2 flex gap-1">
                  {s.businessTypes.map((b) => (
                    <span key={b} className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">{b}</span>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
