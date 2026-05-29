interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  staleUntil: number;
}

export class TtlCache<T> {
  private readonly store = new Map<string, CacheEntry<T>>();

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) return undefined;
    return entry.value;
  }

  getStale(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.staleUntil) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T, ttlMs: number, staleMs: number): void {
    const now = Date.now();
    this.store.set(key, { value, expiresAt: now + ttlMs, staleUntil: now + ttlMs + staleMs });
  }
}
