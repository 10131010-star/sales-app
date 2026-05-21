import { useEffect, useState } from 'react';
import {
  ADOPTION_STATUSES,
  OSAKA_AREAS,
  PRIORITIES,
  SALES_MEMBER_IDS,
  STORE_TYPES,
  memberName,
} from '@/data/constants';
import type { Store } from '@/data/types';
import type { SalesMemberId } from '@/data/constants';
import { Modal } from './ui/Modal';

const emptyStore = (assigneeId: SalesMemberId): Store => ({
  id: '',
  name: '',
  area: OSAKA_AREAS[0],
  address: '',
  businessType: STORE_TYPES[0],
  hours: '',
  phone: '',
  instagramUrl: '',
  googleMapUrl: '',
  reviewSiteUrl: '',
  assigneeId,
  adoptionStatus: '未接触',
  priority: '中',
  salesMemo: '',
  rejectionReason: '',
  nextAction: '',
  nextContactDate: null,
  lastContactDate: null,
  transcriptionText: '',
  aiMemoRaw: '',
  createdAt: '',
  updatedAt: '',
});

interface StoreFormModalProps {
  open: boolean;
  initial?: Store | null;
  defaultAssignee: SalesMemberId;
  onClose: () => void;
  onSave: (store: Store) => void | Promise<void>;
}

export function StoreFormModal({ open, initial, defaultAssignee, onClose, onSave }: StoreFormModalProps) {
  const [form, setForm] = useState<Store>(() => initial ?? emptyStore(defaultAssignee));

  useEffect(() => {
    if (open) setForm(initial ?? emptyStore(defaultAssignee));
  }, [open, initial, defaultAssignee]);

  const set = <K extends keyof Store>(key: K, value: Store[K]) => setForm((f) => ({ ...f, [key]: value }));

  const inputClass = 'w-full rounded-xl border border-slate-200 px-3 py-3 text-base min-h-[48px] mt-1';

  return (
    <Modal
      open={open}
      title={initial ? '店舗を編集' : '店舗を追加'}
      onClose={onClose}
      onSave={() => void onSave(form)}
      saveLabel="保存"
    >
      <label className="block text-sm font-medium text-slate-600">
        店舗名 *
        <input className={inputClass} value={form.name} onChange={(e) => set('name', e.target.value)} required />
      </label>
      <label className="block text-sm font-medium text-slate-600">
        エリア
        <select className={inputClass} value={form.area} onChange={(e) => set('area', e.target.value)}>
          {OSAKA_AREAS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium text-slate-600">
        住所
        <input className={inputClass} value={form.address} onChange={(e) => set('address', e.target.value)} />
      </label>
      <label className="block text-sm font-medium text-slate-600">
        業態
        <select className={inputClass} value={form.businessType} onChange={(e) => set('businessType', e.target.value)}>
          {STORE_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium text-slate-600">
        担当者
        <select
          className={inputClass}
          value={form.assigneeId}
          onChange={(e) => set('assigneeId', e.target.value as SalesMemberId)}
        >
          {SALES_MEMBER_IDS.map((id) => (
            <option key={id} value={id}>{memberName(id)}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium text-slate-600">
        導入状況
        <select
          className={inputClass}
          value={form.adoptionStatus}
          onChange={(e) => set('adoptionStatus', e.target.value as Store['adoptionStatus'])}
        >
          {ADOPTION_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium text-slate-600">
        優先度
        <select className={inputClass} value={form.priority} onChange={(e) => set('priority', e.target.value as Store['priority'])}>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium text-slate-600">
        次回アクション
        <input className={inputClass} value={form.nextAction} onChange={(e) => set('nextAction', e.target.value)} />
      </label>
      <label className="block text-sm font-medium text-slate-600">
        営業時間
        <input className={inputClass} value={form.hours} onChange={(e) => set('hours', e.target.value)} />
      </label>
      <label className="block text-sm font-medium text-slate-600">
        電話番号
        <input className={inputClass} value={form.phone} onChange={(e) => set('phone', e.target.value)} />
      </label>
      <label className="block text-sm font-medium text-slate-600">
        Instagram URL
        <input className={inputClass} value={form.instagramUrl} onChange={(e) => set('instagramUrl', e.target.value)} />
      </label>
      <label className="block text-sm font-medium text-slate-600">
        GoogleMap URL
        <input className={inputClass} value={form.googleMapUrl} onChange={(e) => set('googleMapUrl', e.target.value)} />
      </label>
      <label className="block text-sm font-medium text-slate-600">
        口コミサイトURL
        <input className={inputClass} value={form.reviewSiteUrl} onChange={(e) => set('reviewSiteUrl', e.target.value)} />
      </label>
      <label className="block text-sm font-medium text-slate-600">
        営業メモ
        <textarea className={`${inputClass} min-h-[72px]`} value={form.salesMemo} onChange={(e) => set('salesMemo', e.target.value)} />
      </label>
      <label className="block text-sm font-medium text-slate-600">
        断り理由
        <input className={inputClass} value={form.rejectionReason} onChange={(e) => set('rejectionReason', e.target.value)} />
      </label>
      <label className="block text-sm font-medium text-slate-600">
        次回接触予定日
        <input
          type="date"
          className={inputClass}
          value={form.nextContactDate ?? ''}
          onChange={(e) => set('nextContactDate', e.target.value || null)}
        />
      </label>
    </Modal>
  );
}
