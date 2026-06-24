import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TtlCache } from './ttl-cache';

const TEN_MINUTES = 10 * 60 * 1000;

describe('TtlCache', () => {
  let cache: TtlCache<string>;

  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    cache = new TtlCache<string>(TEN_MINUTES);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null for an unknown key', () => {
    expect(cache.get('lviv')).toBeNull();
  });

  it('returns the value while still fresh', () => {
    cache.set('lviv', 'data');
    vi.advanceTimersByTime(TEN_MINUTES - 1);
    expect(cache.get('lviv')).toBe('data');
    expect(cache.has('lviv')).toBe(true);
  });

  it('expires the value once the TTL passes', () => {
    cache.set('lviv', 'data');
    vi.advanceTimersByTime(TEN_MINUTES);
    expect(cache.get('lviv')).toBeNull();
    expect(cache.has('lviv')).toBe(false);
  });

  it('clear() removes all entries', () => {
    cache.set('lviv', 'a');
    cache.set('kyiv', 'b');
    cache.clear();
    expect(cache.get('lviv')).toBeNull();
    expect(cache.get('kyiv')).toBeNull();
  });

  it('restores fresh entries from storage in a new instance (survives reload)', () => {
    const first = new TtlCache<string>(TEN_MINUTES, 'cache-key');
    first.set('lviv', 'data');
    const reloaded = new TtlCache<string>(TEN_MINUTES, 'cache-key');
    expect(reloaded.get('lviv')).toBe('data');
  });

  it('does not restore entries that expired before reload', () => {
    const first = new TtlCache<string>(TEN_MINUTES, 'cache-key');
    first.set('lviv', 'data');
    vi.advanceTimersByTime(TEN_MINUTES);
    const reloaded = new TtlCache<string>(TEN_MINUTES, 'cache-key');
    expect(reloaded.get('lviv')).toBeNull();
  });
});
