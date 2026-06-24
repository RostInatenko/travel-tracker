import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
} from '@angular/core';
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
import { WikipediaService, WikiMedia } from '../../core/services/wikipedia';
import { PlaceDetails } from '../../core/models/place';

type DetailState =
  | { status: 'loading' }
  | { status: 'loaded'; details: PlaceDetails; media: WikiMedia | null }
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
  private readonly wikipedia = inject(WikipediaService);
  private readonly wishlist = inject(WishlistStore);

  readonly id = input.required<string>();

  private readonly state$ = toObservable(this.id).pipe(
    switchMap((id) =>
      this.placesApi.getDetails(id).pipe(
        switchMap((details) => {
          if (!details) {
            return of({ status: 'notfound' } as DetailState);
          }
          if (!details.wikipedia) {
            return of({ status: 'loaded', details, media: null } as DetailState);
          }
          return this.wikipedia
            .getMedia(details.wikipedia)
            .pipe(map((media) => ({ status: 'loaded', details, media }) as DetailState));
        }),
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

  protected readonly media = computed(() => {
    const s = this.state();
    return s.status === 'loaded' ? s.media : null;
  });

  protected readonly galleryImages = computed<string[]>(() => {
    const images = this.media()?.images ?? [];
    if (images.length) {
      return images;
    }
    const place = this.details();
    return place ? [place.thumbnailUrl] : [];
  });

  // Resets to the first photo whenever the place (and thus the gallery) changes,
  // but a thumbnail click can override it until then.
  protected readonly selectedPhoto = linkedSignal(() => this.galleryImages()[0] ?? '');

  protected readonly wikipediaUrl = computed(() => this.media()?.pageUrl ?? null);

  protected readonly saved = computed(() => {
    const place = this.details();
    return place ? this.wishlist.has(place.id) : false;
  });

  protected selectPhoto(url: string): void {
    this.selectedPhoto.set(url);
  }

  protected toggleWishlist(): void {
    const place = this.details();
    if (place) {
      this.wishlist.toggle(place);
    }
  }
}
