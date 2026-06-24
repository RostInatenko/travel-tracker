import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Place } from '../../core/models/place';

@Component({
  selector: 'app-place-card',
  imports: [RouterLink, MatCardModule, MatIconModule],
  templateUrl: './place-card.html',
  styleUrl: './place-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaceCard {
  readonly place = input.required<Place>();
}
