import { useEffect, type ReactNode } from 'react';
import { Button } from './Button';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  onSave?: () => void;
  saveLabel?: string;
  danger?: boolean;
}

export function Modal({ open, title, onClose, children, onSave, saveLabel = '保存', danger }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center pointer-events-auto"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 pointer-events-auto"
        aria-label="閉じる"
        onClick={onClose}
      />
      <div className="relative z-[101] w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl pointer-events-auto mx-0 sm:mx-4">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-4 py-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} className="text-slate-500 text-2xl leading-none p-2 min-h-[44px] min-w-[44px]">
            ×
          </button>
        </div>
        <div className="p-4 space-y-4">{children}</div>
        <div className="sticky bottom-0 bg-white border-t border-slate-100 p-4 flex gap-2">
          <Button variant="secondary" fullWidth onClick={onClose}>
            キャンセル
          </Button>
          {onSave && (
            <Button fullWidth variant={danger ? 'danger' : 'primary'} onClick={onSave}>
              {saveLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
