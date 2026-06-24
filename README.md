# Travel Tracker

A web app for discovering tourist places by city and keyword and saving the
ones you want to visit to a wishlist that survives page reloads.

**Live demo:** https://rostinatenko.github.io/travel-tracker/

## Features

- **Search** tourist places by city (location) and an optional keyword.
- **Place details** on a deep-linkable page: type, address, coordinates, a map
  image, website, and a Wikipedia link.
- **Wishlist** — save/remove places; the list is stored in `localStorage` and
  restored on reload.
- **10-minute cache** — repeat searches for the same city within ten minutes are
  served from a `localStorage`-backed cache instead of calling the API again, so
  it also holds across page reloads.

## Tech stack

- **Angular 22** — standalone components, signals, zoneless change detection,
  the built-in control flow (`@if` / `@for` / `@switch`), and lazy-loaded routes.
- **Angular Material** for UI.
- **Geoapify** Geocoding, Places, Place Details, and Static Maps APIs.
- **RxJS** for the search pipeline (`debounceTime`, `switchMap`).
- **Vitest** for unit tests.

## Architecture

The app is intentionally decoupled from the data provider:

```
Components ──► PlacesApi (abstract contract) ──► GeoapifyPlacesApi (implementation)
                                                   ├─ HttpClient
                                                   ├─ TtlCache (10-minute cache)
                                                   └─ maps raw API JSON ──► app models
```

- **`core/services/places-api.ts`** defines an abstract `PlacesApi` class used as
  the dependency-injection token. Components depend only on this contract.
- **`core/services/geoapify.ts`** is the only file aware of Geoapify. It calls the
  API and maps the raw responses into the app's own models. Switching providers is
  a one-line change in `app.config.ts`.
- **`core/cache/ttl-cache.ts`** is a small generic time-to-live cache, optionally
  mirrored to `localStorage` so the TTL survives reloads. Search results are cached
  per city; the keyword filter runs in memory afterwards, so changing the keyword
  for an already-fetched city never triggers a new request.
- **`core/services/wishlist-store.ts`** holds the wishlist in a signal, mirrors it
  to `localStorage` via an `effect`, and restores it on startup.

### Project structure

```
src/app/
├── core/
│   ├── models/place.ts          # Place, PlaceDetails, GeoPoint
│   ├── cache/ttl-cache.ts       # generic TTL cache (+ tests)
│   └── services/
│       ├── places-api.ts        # abstract PlacesApi contract
│       ├── geoapify.ts          # Geoapify implementation
│       └── wishlist-store.ts    # wishlist state + localStorage (+ tests)
├── features/
│   ├── search/                  # /search
│   ├── place-detail/            # /place/:id
│   └── wishlist/                # /wishlist
└── shared/place-card/           # reusable card used by search & wishlist
```

## A note on ratings and reviews

The assignment mentions ratings and user reviews. Geoapify's free tier does not
provide user ratings or reviews, so the detail page shows the metadata the API
does provide (type, address, website, Wikipedia) and states clearly that ratings
and reviews are unavailable. The provider lives behind the `PlacesApi` abstraction,
so a provider that offers reviews could be added without changing any feature code.

## Getting started

### Prerequisites

- Node.js `>= 24.15` (or `>= 22.22`) and npm.
- A free [Geoapify](https://www.geoapify.com/) API key.

### Setup

```bash
npm install
```

Add your Geoapify key in `src/environments/environment.ts` and
`src/environments/environment.development.ts`:

```ts
export const environment = {
  production: false,
  geoapify: {
    apiKey: 'YOUR_GEOAPIFY_KEY',
    // ...urls
  },
};
```

> The Geoapify key is a client-side key — it ships in the browser bundle, which is
> expected for this kind of API. In production it is restricted to the deployed
> origin from the Geoapify dashboard.

### Run

```bash
npm start        # dev server at http://localhost:4200
npm test         # unit tests (Vitest)
npm run build    # production build to dist/
```

## Deployment

The app is a static single-page application deployed to **GitHub Pages** via a
GitHub Actions workflow on every push to `main`.
