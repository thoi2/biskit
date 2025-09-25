// types/api.ts (타입만)
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
  timestamp: string;
  body: T;
}

export interface ApiError {
  code: string;
  message: string;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  status: number;
  body: {
    error: ApiError;
  };
}
