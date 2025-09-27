// src/features/ai/types.ts

// ✅ 기존 타입들 (호환성 유지)
export interface RecommendationItem {
  category: string;
  survivalRate: number[];
}

export interface BuildingInfo {
  building_id: number;
  lat: number;
  lng: number;
}

export interface MetaData {
  source: string;
  version: string;
  last_at: string; // ISO 8601 형식의 날짜 문자열
}

export interface SingleBuildingRecommendationResponse {
  building: BuildingInfo;
  result: RecommendationItem[];
  meta: MetaData;
}

export interface RecommendRequest {
  lat: number;
  lng: number;
}

export interface RecommendCategoryRequest {
  lat: number;
  lng: number;
  category: string;
}

export interface PolygonCategoryRequest {
  polygon: RecommendRequest[];
  category: string;
}

export interface BuildingItem {
  buildingId: number;
  lat: string; // JSON 데이터에서 문자열이므로 string으로 지정
  lng: string; // JSON 데이터에서 문자열이므로 string으로 지정
  favorite: boolean;
  categories: RecommendationItem[]; // CategoryInfo 타입의 배열
}

export interface BuildingListResponse {
  items: BuildingItem[]; // BuildingItem 타입의 배열
}

export interface DeleteCategoriesRequest {
  categories: string[];
}

// ✅ Range API 응답 타입들 (실제 응답 구조에 맞춤)

// Range API 단일 아이템 타입
export interface RangeResponseItem {
  building_id: number;
  category: string;
  lat: number;
  lng: number;
  survival_rate: number[];
}

// Range API Body 타입
export interface RangeResponseBody {
  items: RangeResponseItem[];
}

// Range API 전체 응답 타입
export interface RangeApiResponse {
  success: boolean;
  status: number;
  body: RangeResponseBody;
}

// ✅ 새로 추가된 타입들 (건물별 관리용)

// 업종 정보 (확장된 버전)
export interface CategoryInfo {
  category: string;
  category_id?: number;
  survivalRate: number[];
  rank?: number;
  isRangeResult?: boolean;
  sessionId?: string;
}

// 통합된 건물별 추천 데이터
export interface BuildingRecommendation {
  building: BuildingInfo;
  categories: CategoryInfo[];
  isFavorite?: boolean;
  isVisible?: boolean;
  source: 'single' | 'range' | 'db';
  timestamp?: number; // ✅ timestamp 필드 추가
  lastUpdated: string;
}

// Range 응답 타입 (기존 - 하위 호환성 유지)
export interface RangeRecommendationResponse {
  items: Array<{
    buildingId: number;
    category: string;
    lat: number;
    lng: number;
    survivalRate: number[];
  }>;
  totalBuildings?: number;
  returnedCount?: number;
  category?: string;
}

// 마커 타입
export interface RecommendationMarker {
  id: string;
  buildingId: number;
  title: string;
  category: string;
  lat: number;
  lng: number;
  survivalRate: number;
  type: 'recommendation';
  source: 'single' | 'range' | 'db';
  isHighlighted: boolean;
  hidden: boolean;
  color: string;
}

// ✅ API 공통 응답 타입 (제네릭)
export interface ApiResponse<T> {
  success: boolean;
  status: number;
  body: T;
}

// ✅ GMS 설명 API 타입들
export interface IndustryExplanationRequest {
  building_id: number;
  category: string;
  lat?: number;
  lng?: number;
}

export interface IndustryExplanationResponse {
  explanation: string;
  building_id: number;
  category: string;
  generated_at?: string;
}

// ✅ 사용자 결과 API 타입들
export interface UserResultItem {
  buildingId: number;
  building_id: number;
  category: string;
  lat: number;
  lng: number;
  survival_rate: number[];
  survivalRate: number[]; // 하위 호환성
  rank?: number;
  is_favorite?: boolean;
  favorite?: boolean; // 하위 호환성
  created_at?: string;
}

export interface UserResultsResponse {
  items: UserResultItem[];
  total?: number;
}

// ✅ 좋아요/삭제 API 타입들
export interface LikeRequest {
  building_id: string | number;
}

export interface DeleteRequest {
  building_id: string | number;
}

export interface LikeResponse {
  success: boolean;
  message: string;
  building_id: number;
}

export interface DeleteResponse {
  success: boolean;
  message: string;
  building_id: number;
}

// ✅ Area Analysis 관련 타입들 (useAreaAnalysis용)
export interface PolygonPoint {
  lat: number;
  lng: number;
}

export interface AreaInfo {
  area: number;
  storeCount: number;
  isValid: boolean;
  errorMessage?: string;
}

export interface AnalysisRecommendation {
  id: string;
  category: string;
  lat: number;
  lng: number;
  survivalRate: number[];
  buildingId: number;
  score: number;
}

export interface AnalysisResult {
  success: boolean;
  recommendations?: AnalysisRecommendation[];
  summary?: {
    totalStores: number;
    averageScore: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
  error?: string;
}

// ✅ 에러 응답 타입
export interface ApiError {
  success: false;
  status: number;
  message: string;
  errors?: string[];
}

// ✅ 타입 가드 함수들
export function isApiError(response: any): response is ApiError {
  return response && response.success === false && typeof response.message === 'string';
}

export function isRangeApiResponse(response: any): response is RangeApiResponse {
  return response &&
      response.success === true &&
      response.body &&
      Array.isArray(response.body.items);
}

export function hasItems(response: any): boolean {
  return !!(response?.body?.items && Array.isArray(response.body.items)) ||
      !!(response?.items && Array.isArray(response.items)) ||
      Array.isArray(response);
}

// ✅ 상수들
export const API_ENDPOINTS = {
  SINGLE_RECOMMENDATION: '/ai/single',
  RANGE_RECOMMENDATION: '/ai/range',
  INDUSTRY_EXPLANATION: '/ai/explanation',
  USER_RESULTS: '/ai/user-results',
  ADD_LIKE: '/ai/like',
  DELETE_LIKE: '/ai/like',
  DELETE_RESULT: '/ai/result'
} as const;

export const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
} as const;

export const RECOMMENDATION_SOURCES = {
  SINGLE: 'single',
  RANGE: 'range',
  DB: 'db'
} as const;
