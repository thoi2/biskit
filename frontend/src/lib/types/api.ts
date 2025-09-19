export interface Location {
  lat: number;
  lng: number;
}

export interface Bounds {
  southwest: Location;
  northeast: Location;
}

export interface InBoundsRequest {
  bounds: Bounds;
}

export interface ApiResponse<T> {
  success: boolean;
  status: number;
  body: T;
}
