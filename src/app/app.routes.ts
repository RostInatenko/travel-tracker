import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'search', pathMatch: 'full' },
  {
    path: 'search',
    loadComponent: () => import('./features/search/search').then((m) => m.SearchPage),
  },
  {
    path: 'place/:id',
    loadComponent: () =>
      import('./features/place-detail/place-detail').then((m) => m.PlaceDetailPage),
  },
  { path: '**', redirectTo: 'search' },
];
