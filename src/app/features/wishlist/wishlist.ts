import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PlaceCard } from '../../shared/place-card/place-card';
import { WishlistStore } from '../../core/services/wishlist-store';

@Component({
  selector: 'app-wishlist',
  imports: [RouterLink, PlaceCard],
  templateUrl: './wishlist.html',
  styleUrl: './wishlist.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WishlistPage {
  private readonly store = inject(WishlistStore);
  protected readonly items = this.store.items;
}
