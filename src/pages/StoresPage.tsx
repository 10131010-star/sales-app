import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '@/context/DataContext';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { StoreFormModal } from '@/components/StoreFormModal';
import {
  ADOPTION_STATUSES,
  OSAKA_AREAS,
  PRIORITIES,
  SALES_MEMBER_IDS,
  STORE_TYPES,
  memberName,
} from '@/data/constants';
import type { Store } from '@/data/types';
import { uid, todayStr } from '@/lib/utils';

export function StoresPage() {
  const { data, currentMemberId, saveStore, removeStore } = useData();
  const [search, setSearch] = useState('');
  const [area, setArea] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [assignee, setAssignee] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Store | null>(null);

  const filtered = useMemo(() => {
    return data.stores.filter((s) => {
      if (search && !s.name.includes(search) && !s.address.includes(search)) return false;
      if (area && s.area !== area) return false;
      if (businessType && s.businessType !== businessType) return false;
      if (assignee && s.assigneeId !== assignee) return false;
      if (status && s.adoptionStatus !== status) return false;
      if (priority && s.priority !== priority) return false;
      return true;
    });
  }, [data.stores, search, area, businessType, assignee, status, priority]);

  const handleSave = async (form: Store) => {
    const now = new Date().toISOString();
    await saveStore({
      ...form,
      id: form.id || uid(),
      createdAt: form.createdAt || now,
      updatedAt: now,
      lastContactDate: form.lastContactDate || todayStr(),
    });
    setModalOpen(false);
    setEditing(null);
  };

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  return (
    <div className="space-y-4 pb-4 relative">
      <header className="flex justify-between items-start gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">店舗</h1>
          <p className="text-sm text-slate-500">{filtered.length}件</p>
        </div>
        <Button size="md" onClick={openAdd} className="shrink-0 relative z-10">
          ＋ 追加
        </Button>
      </header>

      <input
        type="search"
        placeholder="店舗名・住所で検索"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base min-h-[48px]"
      />

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <Chip label="全エリア" active={!area} onClick={() => setArea('')} />
        {OSAKA_AREAS.slice(0, 8).map((a) => (
          <Chip key={a} label={a} active={area === a} onClick={() => setArea(a === area ? '' : a)} />
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <Chip label="全業態" active={!businessType} onClick={() => setBusinessType('')} />
        {STORE_TYPES.slice(0, 6).map((t) => (
          <Chip key={t} label={t} active={businessType === t} onClick={() => setBusinessType(businessType === t ? '' : t)} />
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <Chip label="全担当" active={!assignee} onClick={() => setAssignee('')} />
        {SALES_MEMBER_IDS.map((id) => (
          <Chip key={id} label={memberName(id)} active={assignee === id} onClick={() => setAssignee(assignee === id ? '' : id)} />
        ))}
      </div>

      <details className="text-sm">
        <summary className="text-violet-600 font-medium cursor-pointer">詳細フィルタ</summary>
        <div className="flex flex-wrap gap-2 mt-2">
          {ADOPTION_STATUSES.slice(0, 5).map((st) => (
            <Chip key={st} label={st} active={status === st} onClick={() => setStatus(status === st ? '' : st)} />
          ))}
          {PRIORITIES.map((p) => (
            <Chip key={p} label={`優先${p}`} active={priority === p} onClick={() => setPriority(priority === p ? '' : p)} />
          ))}
        </div>
      </details>

      <div className="space-y-3">
        {filtered.map((s) => (
          <Card key={s.id}>
            <Link to={`/stores/${s.id}`} className="block">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg text-slate-900">{s.name}</h3>
                  <p className="text-sm text-slate-500">{s.area} · {s.businessType}</p>
                  <p className="text-xs text-slate-400 mt-1">{memberName(s.assigneeId)} · {s.adoptionStatus}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${s.priority === '高' ? 'bg-red-100 text-red-700' : 'bg-slate-100'}`}>
                  {s.priority}
                </span>
              </div>
              {s.nextAction && <p className="text-sm text-violet-600 mt-2">→ {s.nextAction}</p>}
            </Link>
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="secondary" onClick={() => { setEditing(s); setModalOpen(true); }}>
                編集
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  if (confirm('削除しますか？')) void removeStore(s.id);
                }}
              >
                削除
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <StoreFormModal
        open={modalOpen}
        initial={editing}
        defaultAssignee={currentMemberId}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSave={handleSave}
      />
    </div>
  );
}
