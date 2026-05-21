import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useData } from '@/context/DataContext';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { KNOWLEDGE_CATEGORIES, memberName } from '@/data/constants';
import type { KnowledgeItem } from '@/data/types';
import { uid } from '@/lib/utils';
import { getKnowledgeUsageMap, incrementKnowledgeUsage } from '@/lib/knowledge/usage';

type ViewMode = 'all' | 'favorite' | 'frequent';

const EMPTY_FORM = (): Partial<KnowledgeItem> => ({
  title: '',
  category: '初回訪問',
  summary: '',
  talkScript: '',
  customerPsychology: '',
  ngExample: '',
  successPoint: '',
  nextAction: '',
  tags: [],
  favorite: false,
});

export function KnowledgePage() {
  const { data, storageMode, currentMemberId, saveKnowledge, removeKnowledge } = useData();
  const [category, setCategory] = useState<string>('');
  const [keyword, setKeyword] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [usageMap, setUsageMap] = useState(getKnowledgeUsageMap);
  const [detail, setDetail] = useState<KnowledgeItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<Partial<KnowledgeItem>>(EMPTY_FORM());
  const formDirtyRef = useRef(false);

  const patchForm = useCallback((patch: Partial<KnowledgeItem>) => {
    formDirtyRef.current = true;
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  /** 詳細表示はリアルタイム同期（編集モーダル中はフォームを上書きしない） */
  useEffect(() => {
    if (!detail || modalOpen) return;
    const fresh = data.knowledgeItems.find((k) => k.id === detail.id);
    if (fresh) setDetail(fresh);
    else setDetail(null);
  }, [data.knowledgeItems, detail, modalOpen]);

  useEffect(() => {
    if (!modalOpen || !form.id) return;
    if (!data.knowledgeItems.some((k) => k.id === form.id)) {
      setModalOpen(false);
      setForm(EMPTY_FORM());
      formDirtyRef.current = false;
    }
  }, [data.knowledgeItems, modalOpen, form.id]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    data.knowledgeItems.forEach((k) => k.tags.forEach((t) => set.add(t)));
    return [...set].sort();
  }, [data.knowledgeItems]);

  const filtered = useMemo(() => {
    let list = [...data.knowledgeItems];
    if (category) list = list.filter((k) => k.category === category);
    if (viewMode === 'favorite') list = list.filter((k) => k.favorite);
    if (tagFilter) list = list.filter((k) => k.tags.includes(tagFilter));
    if (keyword.trim()) {
      const q = keyword.trim().toLowerCase();
      list = list.filter((k) => {
        const hay = [
          k.title,
          k.summary,
          k.talkScript,
          k.customerPsychology,
          k.ngExample,
          k.successPoint,
          k.tags.join(' '),
        ]
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      });
    }
    if (viewMode === 'frequent') {
      list.sort((a, b) => (usageMap[b.id] ?? 0) - (usageMap[a.id] ?? 0));
    } else {
      list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }
    return list;
  }, [data.knowledgeItems, category, keyword, tagFilter, viewMode, usageMap]);

  const openAdd = () => {
    formDirtyRef.current = false;
    setForm({ ...EMPTY_FORM(), createdBy: currentMemberId });
    setModalOpen(true);
  };

  const openEdit = (k: KnowledgeItem) => {
    formDirtyRef.current = false;
    setForm(k);
    setModalOpen(true);
  };

  const handleDeleteForm = async () => {
    if (!form.id || !confirm('このナレッジを削除しますか？')) return;
    await removeKnowledge(form.id);
    formDirtyRef.current = false;
    setModalOpen(false);
    setForm(EMPTY_FORM());
  };

  const handleSave = async () => {
    const now = new Date().toISOString();
    const item: KnowledgeItem = {
      id: form.id ?? uid(),
      category: (form.category ?? '初回訪問') as KnowledgeItem['category'],
      title: form.title?.trim() ?? '',
      summary: form.summary ?? '',
      talkScript: form.talkScript ?? '',
      customerPsychology: form.customerPsychology ?? '',
      ngExample: form.ngExample ?? '',
      successPoint: form.successPoint ?? '',
      nextAction: form.nextAction ?? '',
      tags: form.tags ?? [],
      favorite: form.favorite ?? false,
      createdBy: form.createdBy ?? currentMemberId,
      updatedBy: currentMemberId,
      viewCount: form.viewCount ?? 0,
      useCount: form.useCount ?? 0,
      createdAt: form.createdAt ?? now,
      updatedAt: now,
    };
    if (!item.title) return;
    await saveKnowledge(item);
    formDirtyRef.current = false;
    setModalOpen(false);
    setForm(EMPTY_FORM());
  };

  const copyText = useCallback(async (k: KnowledgeItem) => {
    const text = [k.title, k.summary, '', k.talkScript].filter(Boolean).join('\n');
    await navigator.clipboard.writeText(text);
    const count = incrementKnowledgeUsage(k.id);
    setUsageMap((m) => ({ ...m, [k.id]: count }));
  }, []);

  const openDetail = (k: KnowledgeItem) => {
    setDetail(k);
    void saveKnowledge({ ...k, viewCount: (k.viewCount ?? 0) + 1 });
  };

  const toggleFavorite = async (k: KnowledgeItem) => {
    await saveKnowledge({ ...k, favorite: !k.favorite, updatedBy: currentMemberId });
  };

  const categoryColor: Record<string, string> = {
    初回訪問: '#6366f1',
    切り返し: '#f59e0b',
    提案: '#10b981',
    クロージング: '#ec4899',
    成功事例: '#8b5cf6',
  };

  return (
    <div className="space-y-4 pb-4">
      <header className="flex justify-between items-start gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ナレッジ</h1>
          <p className="text-sm text-slate-500">
            {filtered.length}件 · {storageMode === 'supabase' ? 'リアルタイム共同編集' : 'この端末のみ保存'}
          </p>
        </div>
        <Button onClick={openAdd}>＋ 追加</Button>
      </header>

      <input
        type="search"
        placeholder="キーワード検索（タイトル・トーク・タグ）"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 min-h-[48px] text-base"
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
        <Chip label="すべて" active={viewMode === 'all' && !category} onClick={() => { setViewMode('all'); setCategory(''); }} />
        {KNOWLEDGE_CATEGORIES.map((c) => (
          <Chip
            key={c}
            label={c}
            active={category === c}
            color={categoryColor[c]}
            onClick={() => setCategory(category === c ? '' : c)}
          />
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        <Chip label="⭐ お気に入り" active={viewMode === 'favorite'} onClick={() => setViewMode(viewMode === 'favorite' ? 'all' : 'favorite')} />
        <Chip label="🔥 よく使う" active={viewMode === 'frequent'} onClick={() => setViewMode(viewMode === 'frequent' ? 'all' : 'frequent')} />
      </div>

      {allTags.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Chip label="全タグ" active={!tagFilter} onClick={() => setTagFilter('')} />
          {allTags.slice(0, 12).map((t) => (
            <Chip key={t} label={`#${t}`} active={tagFilter === t} onClick={() => setTagFilter(tagFilter === t ? '' : t)} />
          ))}
        </div>
      )}

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card>
            <p className="text-sm text-slate-500 text-center py-4">該当するナレッジがありません</p>
          </Card>
        ) : (
          filtered.map((k) => (
            <Card
              key={k.id}
              accent={categoryColor[k.category]}
              onClick={() => openDetail(k)}
            >
              <div className="flex justify-between items-start gap-2">
                <span className="text-xs font-semibold text-violet-700">{k.category}</span>
                <div className="flex gap-1 shrink-0">
                  {k.favorite && <span className="text-sm">⭐</span>}
                  {(usageMap[k.id] ?? 0) > 0 && (
                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                      {usageMap[k.id]}回
                    </span>
                  )}
                </div>
              </div>
              <h3 className="font-bold text-lg text-slate-900 mt-1">{k.title}</h3>
              {k.summary && <p className="text-sm text-slate-600 mt-1 line-clamp-2">{k.summary}</p>}
              <div className="flex flex-wrap gap-1 mt-2">
                {k.tags.slice(0, 4).map((t) => (
                  <span key={t} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    #{t}
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                {k.createdBy === 'system' ? '初期データ' : memberName(k.createdBy)}
              </p>
            </Card>
          ))
        )}
      </div>

      <Modal
        open={!!detail}
        title={detail?.title ?? ''}
        onClose={() => setDetail(null)}
        saveLabel="閉じる"
        onSave={() => setDetail(null)}
      >
        {detail && (
          <div className="space-y-4 text-sm">
            <span className="inline-block text-xs font-bold text-violet-700 bg-violet-50 px-2 py-1 rounded-full">
              {detail.category}
            </span>
            {detail.summary && (
              <section>
                <p className="font-semibold text-slate-700">要約</p>
                <p className="mt-1 text-slate-600">{detail.summary}</p>
              </section>
            )}
            <section>
              <p className="font-semibold text-slate-700">トーク</p>
              <pre className="mt-1 whitespace-pre-wrap text-slate-800 bg-slate-50 rounded-xl p-3 text-sm leading-relaxed">
                {detail.talkScript}
              </pre>
            </section>
            {detail.customerPsychology && (
              <section>
                <p className="font-semibold text-slate-700">お客様心理</p>
                <p className="mt-1 text-slate-600">{detail.customerPsychology}</p>
              </section>
            )}
            {detail.ngExample && (
              <section>
                <p className="font-semibold text-amber-700">NG例</p>
                <p className="mt-1 text-amber-800">{detail.ngExample}</p>
              </section>
            )}
            {detail.successPoint && (
              <section>
                <p className="font-semibold text-emerald-700">成功ポイント</p>
                <p className="mt-1 text-emerald-800">{detail.successPoint}</p>
              </section>
            )}
            {detail.nextAction && (
              <section>
                <p className="font-semibold text-indigo-700">次のアクション</p>
                <p className="mt-1 text-indigo-800">{detail.nextAction}</p>
              </section>
            )}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void copyText(detail)}
              >
                📋 コピー
              </Button>
              <Button size="sm" variant="secondary" onClick={() => void toggleFavorite(detail)}>
                {detail.favorite ? '★ お気に入り解除' : '☆ お気に入り'}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => { setDetail(null); openEdit(detail); }}>
                編集
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  if (confirm('削除しますか？')) {
                    void removeKnowledge(detail.id);
                    setDetail(null);
                  }
                }}
              >
                削除
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={modalOpen}
        title={form.id ? 'ナレッジ編集' : 'ナレッジ追加'}
        onClose={() => setModalOpen(false)}
      >
        <input
          className="w-full rounded-xl border px-3 py-3 min-h-[48px] mb-2"
          placeholder="タイトル *"
          value={form.title ?? ''}
          onChange={(e) => patchForm({ title: e.target.value })}
        />
        <select
          className="w-full rounded-xl border px-3 py-3 min-h-[48px] mb-2"
          value={form.category ?? '初回訪問'}
          onChange={(e) => patchForm({ category: e.target.value as KnowledgeItem['category'] })}
        >
          {KNOWLEDGE_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <textarea className="w-full rounded-xl border px-3 py-2 min-h-[56px] mb-2" placeholder="要約" value={form.summary ?? ''} onChange={(e) => patchForm({ summary: e.target.value })} />
        <textarea className="w-full rounded-xl border px-3 py-2 min-h-[120px] mb-2 font-mono text-sm" placeholder="トーク原文" value={form.talkScript ?? ''} onChange={(e) => patchForm({ talkScript: e.target.value })} />
        <textarea className="w-full rounded-xl border px-3 py-2 min-h-[56px] mb-2" placeholder="お客様心理" value={form.customerPsychology ?? ''} onChange={(e) => patchForm({ customerPsychology: e.target.value })} />
        <textarea className="w-full rounded-xl border px-3 py-2 min-h-[56px] mb-2" placeholder="NG例" value={form.ngExample ?? ''} onChange={(e) => patchForm({ ngExample: e.target.value })} />
        <textarea className="w-full rounded-xl border px-3 py-2 min-h-[56px] mb-2" placeholder="成功ポイント" value={form.successPoint ?? ''} onChange={(e) => patchForm({ successPoint: e.target.value })} />
        <textarea className="w-full rounded-xl border px-3 py-2 min-h-[56px] mb-2" placeholder="次のアクション" value={form.nextAction ?? ''} onChange={(e) => patchForm({ nextAction: e.target.value })} />
        <input
          className="w-full rounded-xl border px-3 py-3 min-h-[48px] mb-2"
          placeholder="タグ（カンマ区切り）"
          value={(form.tags ?? []).join(', ')}
          onChange={(e) =>
            patchForm({
              tags: e.target.value.split(/[,、]/).map((t) => t.trim()).filter(Boolean),
            })
          }
        />
        <div className="sticky bottom-0 z-10 -mx-6 mt-4 flex items-center justify-between gap-3 border-t border-slate-100 bg-white/95 px-6 py-3 backdrop-blur-sm pb-[calc(5rem+env(safe-area-inset-bottom,0px))]">
          <label className="flex items-center gap-2 text-sm font-medium shrink-0 min-h-[48px]">
            <input
              type="checkbox"
              checked={form.favorite ?? false}
              onChange={(e) => patchForm({ favorite: e.target.checked })}
              className="w-5 h-5 shrink-0"
            />
            <span>お気に入り</span>
          </label>

          <div className="flex items-center justify-end gap-2 shrink-0">
            {form.id && (
              <Button
                type="button"
                variant="danger"
                size="md"
                className="min-w-[72px]"
                onClick={() => void handleDeleteForm()}
              >
                削除
              </Button>
            )}
            <Button
              type="button"
              size="md"
              className="min-w-[80px]"
              onClick={() => void handleSave()}
            >
              保存
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
