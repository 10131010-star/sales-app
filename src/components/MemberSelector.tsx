import { MEMBERS, SALES_MEMBER_IDS } from '@/data/constants';
import { useData } from '@/context/DataContext';
import { Chip } from './ui/Chip';

/** 営業入力用: 中田・密山のみ */
export function SalesMemberSelector() {
  const { currentMemberId, setCurrentMemberId } = useData();
  return (
    <div className="flex flex-wrap gap-2">
      {MEMBERS.filter((m) => SALES_MEMBER_IDS.includes(m.id as 'nakata' | 'mitsuyama')).map((m) => (
        <Chip
          key={m.id}
          label={m.name}
          active={currentMemberId === m.id}
          color={m.color}
          onClick={() => setCurrentMemberId(m.id as 'nakata' | 'mitsuyama')}
        />
      ))}
    </div>
  );
}
