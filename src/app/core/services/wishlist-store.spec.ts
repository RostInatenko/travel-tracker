import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { WishlistStore } from './wishlist-store';
import { Place } from '../models/place';

const makePlace = (id: string): Place => ({
  id,
  name: `Place ${id}`,
  category: 'Square',
  categories: ['tourism'],
  address: 'Somewhere',
  location: { lat: 1, lon: 2 },
  thumbnailUrl: 'http://example.com/map.png',
});

describe('WishlistStore', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('adds a place and reports membership', () => {
    const store = TestBed.inject(WishlistStore);
    expect(store.has('a')).toBe(false);
    store.add(makePlace('a'));
    expect(store.has('a')).toBe(true);
    expect(store.count()).toBe(1);
  });

  it('does not add the same place twice', () => {
    const store = TestBed.inject(WishlistStore);
    store.add(makePlace('a'));
    store.add(makePlace('a'));
    expect(store.count()).toBe(1);
  });

  it('toggles a place in and out', () => {
    const store = TestBed.inject(WishlistStore);
    store.toggle(makePlace('a'));
    expect(store.has('a')).toBe(true);
    store.toggle(makePlace('a'));
    expect(store.has('a')).toBe(false);
  });

  it('removes a place by id', () => {
    const store = TestBed.inject(WishlistStore);
    store.add(makePlace('a'));
    store.remove('a');
    expect(store.count()).toBe(0);
  });
});
