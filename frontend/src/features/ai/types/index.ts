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
  lastUpdated: string;
}

// Range 응답 타입
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
