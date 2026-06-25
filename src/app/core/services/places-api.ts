import { Observable } from 'rxjs';
import { GeoPoint, Place, PlaceDetails } from '../models/place';

export abstract class PlacesApi {
  abstract geocodeCity(city: string): Observable<GeoPoint | null>;
  // Resolves to null when the city can't be found, otherwise the (possibly empty) matches.
  abstract search(city: string, keyword: string): Observable<Place[] | null>;
  abstract getDetails(id: string): Observable<PlaceDetails | null>;
}
