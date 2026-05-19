export function uid(): string {
  return crypto.randomUUID();
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}
