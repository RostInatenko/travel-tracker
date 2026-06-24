import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'search', pathMatch: 'full' },
  {
    path: 'search',
    loadComponent: () => import('./features/search/search').then((m) => m.SearchPage),
  },
  { path: '**', redirectTo: 'search' },
];
