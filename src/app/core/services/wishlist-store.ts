import { Injectable, computed, effect, signal } from '@angular/core';
import { Place } from '../models/place';

const STORAGE_KEY = 'travel-tracker.wishlist';

@Injectable({ providedIn: 'root' })
export class WishlistStore {
  private readonly _items = signal<Place[]>(this.load());

  readonly items = this._items.asReadonly();
  readonly count = computed(() => this._items().length);

  constructor() {
    effect(() => this.persist(this._items()));
  }

  has(id: string): boolean {
    return this._items().some((p) => p.id === id);
  }

  add(place: Place): void {
    if (!this.has(place.id)) {
      this._items.update((list) => [...list, place]);
    }
  }

  remove(id: string): void {
    this._items.update((list) => list.filter((p) => p.id !== id));
  }

  toggle(place: Place): void {
    if (this.has(place.id)) {
      this.remove(place.id);
    } else {
      this.add(place);
    }
  }

  private load(): Place[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Place[]) : [];
    } catch {
      return [];
    }
  }

  private persist(items: Place[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore quota / private-mode write failures
    }
  }
}
