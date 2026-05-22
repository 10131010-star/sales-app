import type { BenchmarkSegment, StoreAnalysisInput } from '@/data/analysis/types';

/** 入力数値からベンチマークセグメントを推定 */
export function inferBenchmarkSegment(input: StoreAnalysisInput): BenchmarkSegment {
  if (input.lateNightRate >= 50) return 'late_night';
  const lunchTypes = ['弁当', 'カフェ', 'ラーメン', '和食'];
  if (
    input.lateNightRate < 28 &&
    (input.setRate >= 50 || lunchTypes.includes(input.businessType))
  ) {
    return 'lunch';
  }
  return 'standard';
}
