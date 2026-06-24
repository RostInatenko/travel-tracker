import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs';

export interface WikiMedia {
  extract: string;
  pageUrl: string;
  images: string[];
}

interface WikiSummaryResponse {
  query?: {
    pages?: Record<
      string,
      { title?: string; extract?: string; missing?: string; thumbnail?: { source: string } }
    >;
  };
}

interface WikiImagesResponse {
  query?: {
    pages?: Record<string, { imageinfo?: Array<{ url?: string; thumburl?: string; mime?: string }> }>;
  };
}

const MAX_IMAGES = 8;
// Drop maps, flags, crests, logos and icons that articles commonly embed.
const NON_PHOTO = /(location_map|locator|flag|coat_of_arms|commons-logo|oojs|_icon)/i;

@Injectable({ providedIn: 'root' })
export class WikipediaService {
  private readonly http = inject(HttpClient);

  // `ref` is Geoapify's "lang:Title" form, e.g. "uk:Площа Ринок (Львів)".
  getMedia(ref: string): Observable<WikiMedia | null> {
    const separator = ref.indexOf(':');
    if (separator < 0) {
      return of(null);
    }
    const lang = ref.slice(0, separator);
    const title = ref.slice(separator + 1).trim();
    const endpoint = `https://${lang}.wikipedia.org/w/api.php`;
    const pageUrl = `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;

    return forkJoin({
      summary: this.fetchSummary(endpoint, title),
      images: this.fetchImages(endpoint, title),
    }).pipe(
      map(({ summary, images }) => {
        if (!summary) {
          return null;
        }
        let gallery = images.slice(0, MAX_IMAGES);
        if (!gallery.length && summary.imageUrl) {
          gallery = [summary.imageUrl];
        }
        return { extract: summary.extract, pageUrl, images: gallery };
      }),
      catchError(() => of(null)),
    );
  }

  private fetchSummary(
    endpoint: string,
    title: string,
  ): Observable<{ extract: string; imageUrl?: string } | null> {
    const params = new HttpParams()
      .set('action', 'query')
      .set('format', 'json')
      .set('prop', 'extracts|pageimages')
      .set('exintro', '1')
      .set('explaintext', '1')
      .set('piprop', 'thumbnail')
      .set('pithumbsize', '800')
      .set('redirects', '1')
      .set('titles', title)
      .set('origin', '*');

    return this.http.get<WikiSummaryResponse>(endpoint, { params }).pipe(
      map((res) => {
        const pages = res.query?.pages;
        const page = pages ? Object.values(pages)[0] : undefined;
        if (!page || page.missing !== undefined || !page.extract) {
          return null;
        }
        return { extract: page.extract, imageUrl: page.thumbnail?.source };
      }),
      catchError(() => of(null)),
    );
  }

  private fetchImages(endpoint: string, title: string): Observable<string[]> {
    const params = new HttpParams()
      .set('action', 'query')
      .set('format', 'json')
      .set('generator', 'images')
      .set('gimlimit', '20')
      .set('redirects', '1')
      .set('titles', title)
      .set('prop', 'imageinfo')
      .set('iiprop', 'url|mime')
      .set('iiurlwidth', '800')
      .set('origin', '*');

    return this.http.get<WikiImagesResponse>(endpoint, { params }).pipe(
      map((res) => {
        const pages = res.query?.pages;
        if (!pages) {
          return [];
        }
        return Object.values(pages)
          .map((page) => page.imageinfo?.[0])
          .filter((info) => info?.mime === 'image/jpeg' || info?.mime === 'image/png')
          .map((info) => info!.thumburl ?? info!.url)
          .filter((url): url is string => !!url && !NON_PHOTO.test(url));
      }),
      catchError(() => of([] as string[])),
    );
  }
}
