import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject, merge, of } from 'rxjs';
import { catchError, debounceTime, filter, map, startWith, switchMap } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PlacesApi } from '../../core/services/places-api';
import { Place } from '../../core/models/place';
import { PlaceCard } from '../../shared/place-card/place-card';

type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'loaded'; places: Place[] }
  | { status: 'error' };

@Component({
  selector: 'app-search',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    PlaceCard,
  ],
  templateUrl: './search.html',
  styleUrl: './search.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchPage {
  private readonly placesApi = inject(PlacesApi);

  protected readonly form = new FormGroup({
    location: new FormControl('', { nonNullable: true }),
    keyword: new FormControl('', { nonNullable: true }),
  });

  private readonly submit$ = new Subject<void>();

  // A submit or a debounced keyword change re-runs the query; switchMap drops
  // any in-flight request so only the latest result is shown.
  private readonly state$ = merge(
    this.submit$,
    this.form.controls.keyword.valueChanges.pipe(debounceTime(300)),
  ).pipe(
    map(() => ({
      city: this.form.controls.location.value.trim(),
      keyword: this.form.controls.keyword.value.trim(),
    })),
    filter((q) => q.city.length > 0),
    switchMap((q) =>
      this.placesApi.search(q.city, q.keyword).pipe(
        map((places) => ({ status: 'loaded', places }) as SearchState),
        startWith({ status: 'loading' } as SearchState),
        catchError(() => of({ status: 'error' } as SearchState)),
      ),
    ),
  );

  protected readonly state = toSignal(this.state$, {
    initialValue: { status: 'idle' } as SearchState,
  });

  protected readonly places = computed(() => {
    const s = this.state();
    return s.status === 'loaded' ? s.places : [];
  });

  protected onSubmit(): void {
    this.submit$.next();
  }
}
