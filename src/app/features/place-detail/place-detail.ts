import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { catchError, map, startWith, switchMap } from 'rxjs';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PlacesApi } from '../../core/services/places-api';
import { WishlistStore } from '../../core/services/wishlist-store';
import { PlaceDetails } from '../../core/models/place';

type DetailState =
  | { status: 'loading' }
  | { status: 'loaded'; details: PlaceDetails }
  | { status: 'notfound' }
  | { status: 'error' };

@Component({
  selector: 'app-place-detail',
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './place-detail.html',
  styleUrl: './place-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaceDetailPage {
  private readonly placesApi = inject(PlacesApi);
  private readonly wishlist = inject(WishlistStore);

  readonly id = input.required<string>();

  private readonly state$ = toObservable(this.id).pipe(
    switchMap((id) =>
      this.placesApi.getDetails(id).pipe(
        map(
          (details) =>
            (details
              ? { status: 'loaded', details }
              : { status: 'notfound' }) as DetailState,
        ),
        startWith({ status: 'loading' } as DetailState),
        catchError(() => of({ status: 'error' } as DetailState)),
      ),
    ),
  );

  protected readonly state = toSignal(this.state$, {
    initialValue: { status: 'loading' } as DetailState,
  });

  protected readonly details = computed(() => {
    const s = this.state();
    return s.status === 'loaded' ? s.details : null;
  });

  protected readonly saved = computed(() => {
    const place = this.details();
    return place ? this.wishlist.has(place.id) : false;
  });

  protected toggleWishlist(): void {
    const place = this.details();
    if (place) {
      this.wishlist.toggle(place);
    }
  }

  protected readonly wikipediaUrl = computed(() => {
    const wiki = this.details()?.wikipedia;
    if (!wiki) {
      return null;
    }
    const separator = wiki.indexOf(':');
    if (separator < 0) {
      return null;
    }
    const lang = wiki.slice(0, separator);
    const title = wiki.slice(separator + 1).trim().replace(/ /g, '_');
    return `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title)}`;
  });
}
