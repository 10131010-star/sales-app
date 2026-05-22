import type { StoreAnalysisInput } from '@/data/analysis/types';

const PREFIX = 'sales-app:store-analysis:';

export function loadStoreAnalysisInput(storeId: string): StoreAnalysisInput | null {
  try {
    const raw = localStorage.getItem(PREFIX + storeId);
    if (!raw) return null;
    return JSON.parse(raw) as StoreAnalysisInput;
  } catch {
    return null;
  }
}

export function saveStoreAnalysisInput(storeId: string, input: StoreAnalysisInput): void {
  localStorage.setItem(PREFIX + storeId, JSON.stringify({ ...input, linkedStoreId: storeId }));
}
