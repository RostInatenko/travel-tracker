import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Place } from '../../core/models/place';
import { WishlistStore } from '../../core/services/wishlist-store';

@Component({
  selector: 'app-place-card',
  imports: [MatCardModule, MatIconModule, MatButtonModule],
  templateUrl: './place-card.html',
  styleUrl: './place-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaceCard {
  private readonly wishlist = inject(WishlistStore);
  private readonly router = inject(Router);

  readonly place = input.required<Place>();

  protected readonly saved = computed(() => this.wishlist.has(this.place().id));

  protected open(): void {
    this.router.navigate(['/place', this.place().id]);
  }

  protected toggle(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.wishlist.toggle(this.place());
  }
}
