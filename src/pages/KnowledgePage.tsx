import { useMemo, useState } from 'react';
import { useData } from '@/context/DataContext';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { IMPORTANCE_LEVELS, KNOWLEDGE_CATEGORIES, OSAKA_AREAS, STORE_TYPES, memberName } from '@/data/constants';
import type { KnowledgeItem } from '@/data/types';
import { uid } from '@/lib/utils';

export function KnowledgePage() {
  const { data, currentMemberId, saveKnowledge, removeKnowledge } = useData();
  const [category, setCategory] = useState('');
  const [area, setArea] = useState('');
  const [storeType, setStoreType] = useState('');
  const [importance, setImportance] = useState('');
  const [keyword, setKeyword] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<Partial<KnowledgeItem>>({});

  const filtered = useMemo(() => {
    return data.knowledgeItems.filter((k) => {
      if (category && k.category !== category) return false;
      if (area && k.targetArea && k.targetArea !== area) return false;
      if (storeType && k.storeType && k.storeType !== storeType) return false;
      if (importance && k.importance !== importance) return false;
      if (keyword) {
        const q = keyword.toLowerCase();
        const hay = `${k.title} ${k.objection} ${k.rebuttal} ${k.tags.join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [data.knowledgeItems, category, area, storeType, importance, keyword]);

  const openAdd = () => {
    setForm({
      title: '',
      category: '切り返し',
      registrantId: currentMemberId,
      importance: '中',
      tags: [],
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const now = new Date().toISOString();
    const item: KnowledgeItem = {
      id: form.id ?? uid(),
      title: form.title ?? '',
      category: (form.category ?? '切り返し') as KnowledgeItem['category'],
      targetArea: form.targetArea ?? '',
      storeType: form.storeType ?? '',
      objection: form.objection ?? '',
      rebuttal: form.rebuttal ?? '',
      successTalk: form.successTalk ?? '',
      ngTalk: form.ngTalk ?? '',
      usageScene: form.usageScene ?? '',
      importance: form.importance ?? '中',
      tags: form.tags ?? [],
      registrantId: form.registrantId ?? currentMemberId,
      memo: form.memo ?? '',
      createdAt: form.createdAt ?? now,
      updatedAt: now,
    };
    await saveKnowledge(item);
    setModalOpen(false);
  };

  return (
    <div className="space-y-4 pb-4">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ナレッジ</h1>
          <p className="text-sm text-slate-500">{filtered.length}件</p>
        </div>
        <Button onClick={openAdd}>＋ 追加</Button>
      </header>

      <input
        type="search"
        placeholder="キーワード検索"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        className="w-full rounded-xl border px-4 py-3 min-h-[48px] text-base"
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
        <Chip label="全カテゴリ" active={!category} onClick={() => setCategory('')} />
        {KNOWLEDGE_CATEGORIES.map((c) => (
          <Chip key={c} label={c} active={category === c} onClick={() => setCategory(category === c ? '' : c)} />
        ))}
      </div>
      <details className="text-sm">
        <summary className="text-violet-600 font-medium cursor-pointer">詳細フィルタ</summary>
        <div className="flex flex-wrap gap-2 mt-2">
          <Chip label="全エリア" active={!area} onClick={() => setArea('')} />
          {OSAKA_AREAS.slice(0, 6).map((a) => (
            <Chip key={a} label={a} active={area === a} onClick={() => setArea(area === a ? '' : a)} />
          ))}
          {STORE_TYPES.slice(0, 5).map((t) => (
            <Chip key={t} label={t} active={storeType === t} onClick={() => setStoreType(storeType === t ? '' : t)} />
          ))}
          {IMPORTANCE_LEVELS.map((i) => (
            <Chip key={i} label={`重要${i}`} active={importance === i} onClick={() => setImportance(importance === i ? '' : i)} />
          ))}
        </div>
      </details>

      <div className="space-y-3">
        {filtered.map((k) => (
          <Card key={k.id}>
            <span className="text-xs font-medium text-violet-600">{k.category}</span>
            {k.importance === '高' && <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">重要</span>}
            <h3 className="font-bold text-lg mt-1">{k.title}</h3>
            {k.objection && (
              <p className="text-sm mt-2"><span className="text-red-600 font-medium">断り:</span> {k.objection}</p>
            )}
            {k.rebuttal && (
              <p className="text-sm mt-2 bg-violet-50 p-3 rounded-xl"><span className="text-violet-700 font-medium">切り返し:</span> {k.rebuttal}</p>
            )}
            {k.ngTalk && <p className="text-sm mt-2 text-amber-700">NG: {k.ngTalk}</p>}
            <p className="text-xs text-slate-400 mt-2">{memberName(k.registrantId)}</p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="secondary" onClick={() => { setForm(k); setModalOpen(true); }}>編集</Button>
              <Button size="sm" variant="danger" onClick={() => confirm('削除？') && void removeKnowledge(k.id)}>削除</Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={modalOpen} title={form.id ? 'ナレッジ編集' : 'ナレッジ追加'} onClose={() => setModalOpen(false)} onSave={() => void handleSave()}>
        <input className="w-full rounded-xl border px-3 py-3 min-h-[48px] mb-2" placeholder="タイトル" value={form.title ?? ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <select className="w-full rounded-xl border px-3 py-3 min-h-[48px] mb-2" value={form.category ?? ''} onChange={(e) => setForm({ ...form, category: e.target.value as KnowledgeItem['category'] })}>
          {KNOWLEDGE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <textarea className="w-full rounded-xl border px-3 py-3 min-h-[60px] mb-2" placeholder="断り文句" value={form.objection ?? ''} onChange={(e) => setForm({ ...form, objection: e.target.value })} />
        <textarea className="w-full rounded-xl border px-3 py-3 min-h-[80px] mb-2" placeholder="切り返し" value={form.rebuttal ?? ''} onChange={(e) => setForm({ ...form, rebuttal: e.target.value })} />
        <textarea className="w-full rounded-xl border px-3 py-3 min-h-[60px]" placeholder="メモ" value={form.memo ?? ''} onChange={(e) => setForm({ ...form, memo: e.target.value })} />
      </Modal>
    </div>
  );
}
