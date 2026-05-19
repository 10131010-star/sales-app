import { useData } from '@/context/DataContext';
import { Chip } from './ui/Chip';

export function MemberSelector() {
  const { data, currentMemberId, setCurrentMemberId } = useData();
  return (
    <div className="flex flex-wrap gap-2">
      {data.members.map((m) => (
        <Chip
          key={m.id}
          label={m.name}
          active={currentMemberId === m.id}
          color={m.color}
          onClick={() => setCurrentMemberId(m.id)}
        />
      ))}
    </div>
  );
}
