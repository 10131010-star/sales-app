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
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="閉じる"
        onClick={onClose}
      />

      <div className="relative z-[101] w-full max-w-lg max-h-[90dvh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col min-h-0 overflow-hidden sm:mx-4">
        {/* ヘッダー（上部固定） */}
        <div className="shrink-0 p-6 border-b border-slate-100 flex justify-between items-center gap-3">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 text-2xl leading-none p-2 min-h-[44px] min-w-[44px] shrink-0"
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        {/* 入力フォームのみスクロール */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6 space-y-4 [-webkit-overflow-scrolling:touch]">
          {children}
        </div>

        {/* 下部固定フッター（onSave 指定時のみ。ナレッジ追加等はフォーム内にボタン配置） */}
        {onSave && (
          <div className="shrink-0 p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] border-t border-slate-100 bg-white flex gap-2">
            <Button variant="secondary" fullWidth onClick={onClose}>
              キャンセル
            </Button>
            <Button fullWidth variant={danger ? 'danger' : 'primary'} onClick={onSave}>
              {saveLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
