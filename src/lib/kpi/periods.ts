import {
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  parseISO,
  isWithinInterval,
} from 'date-fns';
import { ja } from 'date-fns/locale';
import type { PeriodType } from '@/data/constants';
import type { SalesRecord } from '@/data/types';

export function periodKey(type: PeriodType, date = new Date()): string {
  if (type === 'day') return format(date, 'yyyy-MM-dd');
  if (type === 'week') return format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-'W'II");
  return format(date, 'yyyy-MM');
}

export function periodRange(type: PeriodType, date = new Date()): { start: Date; end: Date } {
  if (type === 'day') {
    const d = format(date, 'yyyy-MM-dd');
    const start = parseISO(d);
    return { start, end: start };
  }
  if (type === 'week') {
    return {
      start: startOfWeek(date, { weekStartsOn: 1 }),
      end: endOfWeek(date, { weekStartsOn: 1 }),
    };
  }
  return { start: startOfMonth(date), end: endOfMonth(date) };
}

export function filterRecordsByPeriod(records: SalesRecord[], type: PeriodType, date = new Date()): SalesRecord[] {
  const { start, end } = periodRange(type, date);
  return records.filter((r) => {
    const d = parseISO(r.recordDate);
    return isWithinInterval(d, { start, end });
  });
}

export function periodLabel(type: PeriodType): string {
  const now = new Date();
  if (type === 'day') return format(now, 'M月d日(E)', { locale: ja });
  if (type === 'week') return `${format(startOfWeek(now, { weekStartsOn: 1 }), 'M/d')}週`;
  return format(now, 'yyyy年M月');
}
