export interface SingleRecommendationRequest {
  latitude: number;
  longitude: number;
}

export interface SingleIndustryRecommendationRequest
  extends SingleRecommendationRequest {
  industry: string;
}

export interface RangeRecommendationRequest {
  centerLatitude: number;
  centerLongitude: number;
  radiusMeters: number;
  industry: string;
}

export interface RecommendationItem {
  id: string;
  name: string;
  address: string;
  score: number;
  industry?: string;
}

export interface AiApiResponse<T> {
  message: string;
  data: T;
}
