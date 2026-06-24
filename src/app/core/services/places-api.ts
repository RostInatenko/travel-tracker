import { Observable } from 'rxjs';
import { GeoPoint, Place, PlaceDetails } from '../models/place';

export abstract class PlacesApi {
  abstract geocodeCity(city: string): Observable<GeoPoint | null>;
  abstract search(city: string, keyword: string): Observable<Place[]>;
  abstract getDetails(id: string): Observable<PlaceDetails | null>;
}
