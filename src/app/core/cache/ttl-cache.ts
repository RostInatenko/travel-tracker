interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class TtlCache<T> {
  private readonly store = new Map<string, CacheEntry<T>>();

  constructor(
    private readonly ttlMs: number,
    private readonly storageKey?: string,
  ) {
    this.restore();
  }

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }
    if (Date.now() >= entry.expiresAt) {
      this.store.delete(key);
      this.save();
      return null;
    }
    return entry.value;
  }

  set(key: string, value: T): void {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
    this.save();
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(): void {
    this.store.clear();
    this.save();
  }

  // When a storageKey is given the cache is mirrored to localStorage, so the
  // TTL keeps holding across page reloads, not just within a single session.
  private restore(): void {
    if (!this.storageKey) {
      return;
    }
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) {
        return;
      }
      const entries = JSON.parse(raw) as Array<[string, CacheEntry<T>]>;
      const now = Date.now();
      for (const [key, entry] of entries) {
        if (entry.expiresAt > now) {
          this.store.set(key, entry);
        }
      }
    } catch {
      // ignore corrupt cache data
    }
  }

  private save(): void {
    if (!this.storageKey) {
      return;
    }
    try {
      localStorage.setItem(this.storageKey, JSON.stringify([...this.store.entries()]));
    } catch {
      // ignore quota / private-mode write failures
    }
  }
}
