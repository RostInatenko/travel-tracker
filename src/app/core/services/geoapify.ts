import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GeoPoint, Place, PlaceDetails } from '../models/place';
import { TtlCache } from '../cache/ttl-cache';
import { PlacesApi } from './places-api';

const CACHE_TTL_MS = 10 * 60 * 1000;

const TOURISM_CATEGORIES = [
  'tourism.sights',
  'tourism.attraction',
  'entertainment.museum',
  'entertainment.culture',
  'building.historic',
  'leisure.park',
].join(',');

const SEARCH_RADIUS_M = 5000;
const RESULT_LIMIT = 40;

interface GeoapifyGeocodeResponse {
  results?: Array<{ lat: number; lon: number }>;
}

interface GeoapifyFeatureProps {
  place_id: string;
  name?: string;
  categories?: string[];
  formatted?: string;
  address_line2?: string;
  lat: number;
  lon: number;
  city?: string;
  country?: string;
  website?: string;
  wiki_and_media?: { wikipedia?: string; image?: string };
}

interface GeoapifyPlacesResponse {
  features?: Array<{ properties: GeoapifyFeatureProps }>;
}

function friendlyCategory(categories: string[]): string {
  if (!categories.length) {
    return 'Place';
  }
  // Most specific category = the one with the most dot-separated segments.
  const mostSpecific = [...categories].sort(
    (a, b) => b.split('.').length - a.split('.').length,
  )[0];
  const last = mostSpecific.split('.').pop() ?? mostSpecific;
  return last.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

@Injectable({ providedIn: 'root' })
export class GeoapifyPlacesApi extends PlacesApi {
  private readonly http = inject(HttpClient);
  private readonly cfg = environment.geoapify;
  private readonly searchCache = new TtlCache<Place[]>(CACHE_TTL_MS, 'travel-tracker.places-cache');

  geocodeCity(city: string): Observable<GeoPoint | null> {
    const params = new HttpParams()
      .set('text', city)
      .set('type', 'city')
      .set('format', 'json')
      .set('limit', '1')
      .set('apiKey', this.cfg.apiKey);

    return this.http
      .get<GeoapifyGeocodeResponse>(this.cfg.geocodeUrl, { params })
      .pipe(
        map((res) => {
          const r = res.results?.[0];
          return r ? { lat: r.lat, lon: r.lon } : null;
        }),
      );
  }

  search(city: string, keyword: string): Observable<Place[]> {
    const cityKey = city.trim().toLowerCase();
    const cached = this.searchCache.get(cityKey);

    const places$ = cached
      ? of(cached)
      : this.fetchPlacesForCity(city).pipe(
          tap((places) => this.searchCache.set(cityKey, places)),
        );

    // Keyword is filtered in memory so re-searching a cached city never re-hits the API.
    return places$.pipe(map((places) => this.filterByKeyword(places, keyword)));
  }

  getDetails(id: string): Observable<PlaceDetails | null> {
    const params = new HttpParams().set('id', id).set('apiKey', this.cfg.apiKey);

    return this.http
      .get<GeoapifyPlacesResponse>(this.cfg.placeDetailsUrl, { params })
      .pipe(
        map((res) => {
          const props = res.features?.[0]?.properties;
          return props ? this.toDetails(props) : null;
        }),
      );
  }

  private fetchPlacesForCity(city: string): Observable<Place[]> {
    return this.geocodeCity(city).pipe(
      switchMap((point) => {
        if (!point) {
          return of<Place[]>([]);
        }
        const params = new HttpParams()
          .set('categories', TOURISM_CATEGORIES)
          .set('filter', `circle:${point.lon},${point.lat},${SEARCH_RADIUS_M}`)
          .set('bias', `proximity:${point.lon},${point.lat}`)
          .set('limit', String(RESULT_LIMIT))
          .set('apiKey', this.cfg.apiKey);

        return this.http
          .get<GeoapifyPlacesResponse>(this.cfg.placesUrl, { params })
          .pipe(
            map((res) =>
              (res.features ?? [])
                .map((f) => this.toPlace(f.properties))
                .filter((p) => p.name.length > 0),
            ),
          );
      }),
    );
  }

  private filterByKeyword(places: Place[], keyword: string): Place[] {
    const k = keyword.trim().toLowerCase();
    if (!k) {
      return places;
    }
    return places.filter(
      (p) =>
        p.name.toLowerCase().includes(k) ||
        p.categories.some((c) => c.toLowerCase().includes(k)),
    );
  }

  private toPlace(p: GeoapifyFeatureProps): Place {
    return {
      id: p.place_id,
      name: p.name ?? '',
      category: friendlyCategory(p.categories ?? []),
      categories: p.categories ?? [],
      address: p.formatted ?? p.address_line2 ?? '',
      location: { lat: p.lat, lon: p.lon },
      thumbnailUrl: this.staticMapUrl(p.lon, p.lat),
    };
  }

  private toDetails(p: GeoapifyFeatureProps): PlaceDetails {
    return {
      ...this.toPlace(p),
      city: p.city,
      country: p.country,
      website: p.website,
      wikipedia: p.wiki_and_media?.wikipedia,
      imageUrl: p.wiki_and_media?.image,
    };
  }

  private staticMapUrl(lon: number, lat: number): string {
    const marker = `lonlat:${lon},${lat};color:%23e63946;size:small`;
    return (
      `${this.cfg.staticMapUrl}?style=osm-bright&width=400&height=240` +
      `&center=lonlat:${lon},${lat}&zoom=15&marker=${marker}&apiKey=${this.cfg.apiKey}`
    );
  }
}
