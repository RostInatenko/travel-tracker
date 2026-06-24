export interface GeoPoint {
  lat: number;
  lon: number;
}

export interface Place {
  id: string;
  name: string;
  category: string;
  categories: string[];
  address: string;
  location: GeoPoint;
  thumbnailUrl: string;
}

export interface PlaceDetails extends Place {
  city?: string;
  country?: string;
  website?: string;
  wikipedia?: string;
  imageUrl?: string;
}
