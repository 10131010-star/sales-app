interface SyncNoticeProps {
  visible: boolean;
  onDismiss: () => void;
}

export function SyncNotice({ visible, onDismiss }: SyncNoticeProps) {
  if (!visible) return null;

  return (
    <div
      role="status"
      className="fixed top-3 left-1/2 -translate-x-1/2 z-[90] max-w-[calc(100%-2rem)] mx-auto flex items-center gap-2 rounded-full bg-slate-900/90 text-white text-xs px-4 py-2 shadow-lg backdrop-blur-sm"
    >
      <span>最新データに更新されました</span>
      <button
        type="button"
        onClick={onDismiss}
        className="text-white/80 hover:text-white ml-1 min-h-[24px] min-w-[24px]"
        aria-label="閉じる"
      >
        ×
      </button>
    </div>
  );
}
