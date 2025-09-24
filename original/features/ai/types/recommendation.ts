// types/recommendation.ts
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
// ← 새로 추가
export interface RecommendationResult {
  id: string;
  businessName: string;
  address: string;
  businessType: string;
  closureProbability: {
    year1: number;
    year2: number;
    year3: number;
    year4: number;
    year5: number;
  };
  coordinates: { lat: number; lng: number };
  riskLevel: 'low' | 'medium' | 'high';
  isFavorite: boolean;
  hidden?: boolean;
}
