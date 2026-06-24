import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';
import { PlacesApi } from './core/services/places-api';
import { GeoapifyPlacesApi } from './core/services/geoapify';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    { provide: PlacesApi, useClass: GeoapifyPlacesApi },
  ]
};
