import { SERVICE_COLORS, SERVICE_LABELS, type ServiceId } from '@/data/types';

export function ServiceBadge({ id, small }: { id: ServiceId; small?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full text-white font-medium ${SERVICE_COLORS[id]} ${small ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'}`}
    >
      {SERVICE_LABELS[id]}
    </span>
  );
}
