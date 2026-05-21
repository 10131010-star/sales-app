import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StoreFormModal } from '@/components/StoreFormModal';
import { memberName } from '@/data/constants';

export function StoreDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, saveStore, removeStore } = useData();
  const store = data.stores.find((s) => s.id === id);
  const [editOpen, setEditOpen] = useState(false);

  if (!store) {
    return <p className="text-slate-500 p-4">店舗が見つかりません</p>;
  }

  const handleSave = async (form: typeof store) => {
    await saveStore({ ...form, updatedAt: new Date().toISOString() });
    setEditOpen(false);
  };

  return (
    <div className="space-y-4 pb-8">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{store.name}</h1>
          <p className="text-sm text-slate-500">{store.area} · {store.businessType}</p>
        </div>
        <Button size="sm" variant="ghost" onClick={() => navigate(-1)}>戻る</Button>
      </header>

      <Button fullWidth size="lg" onClick={() => navigate(`/sales?store=${store.id}`)}>
        営業実績を入力
      </Button>

      <Card>
        <dl className="space-y-3 text-sm">
          <div><dt className="text-slate-500">担当</dt><dd className="font-medium">{memberName(store.assigneeId)}</dd></div>
          <div><dt className="text-slate-500">導入状況</dt><dd className="font-medium">{store.adoptionStatus}</dd></div>
          <div><dt className="text-slate-500">優先度</dt><dd className="font-medium">{store.priority}</dd></div>
          <div><dt className="text-slate-500">住所</dt><dd>{store.address || '—'}</dd></div>
          <div><dt className="text-slate-500">電話</dt><dd>{store.phone || '—'}</dd></div>
          <div><dt className="text-slate-500">営業時間</dt><dd>{store.hours || '—'}</dd></div>
          <div><dt className="text-slate-500">次回アクション</dt><dd className="text-violet-700">{store.nextAction || '—'}</dd></div>
          <div><dt className="text-slate-500">次回接触予定</dt><dd>{store.nextContactDate || '—'}</dd></div>
          <div><dt className="text-slate-500">営業メモ</dt><dd className="whitespace-pre-wrap">{store.salesMemo || '—'}</dd></div>
          <div><dt className="text-slate-500">断り理由</dt><dd>{store.rejectionReason || '—'}</dd></div>
        </dl>
      </Card>

      <Card>
        <h3 className="font-bold text-slate-800 mb-2">AI分析用（将来）</h3>
        <p className="text-xs text-slate-500 mb-2">文字起こし・要約用テキスト欄</p>
        <textarea
          className="w-full rounded-xl border px-3 py-2 text-sm min-h-[80px]"
          placeholder="営業録音の文字起こし..."
          value={store.transcriptionText}
          onChange={(e) => void saveStore({ ...store, transcriptionText: e.target.value })}
        />
        <textarea
          className="w-full rounded-xl border px-3 py-2 text-sm min-h-[60px] mt-2"
          placeholder="商談メモ（AI要約前）..."
          value={store.aiMemoRaw}
          onChange={(e) => void saveStore({ ...store, aiMemoRaw: e.target.value })}
        />
      </Card>

      <div className="flex gap-2">
        <Button fullWidth variant="secondary" onClick={() => setEditOpen(true)}>編集</Button>
        <Button
          fullWidth
          variant="danger"
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
