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
  timestamp: string; // searchApi.ts에만 존재하지만, 다른 API에서도 사용될 가능성을 고려하여 포함
  body: T;
}