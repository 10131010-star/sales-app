const USAGE_KEY = 'sales-app:knowledge-usage';

function readMap(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(USAGE_KEY) ?? '{}') as Record<string, number>;
  } catch {
    return {};
  }
}

function writeMap(map: Record<string, number>): void {
  localStorage.setItem(USAGE_KEY, JSON.stringify(map));
}

export function getKnowledgeUsageMap(): Record<string, number> {
  return readMap();
}

export function incrementKnowledgeUsage(id: string): number {
  const map = readMap();
  map[id] = (map[id] ?? 0) + 1;
  writeMap(map);
  return map[id];
}
