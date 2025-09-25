// 추천 결과의 각 항목에 대한 타입
export interface RecommendationItem {
  category: string;
  survivalRate: number;
}

// 빌딩 정보에 대한 타입
export interface BuildingInfo {
  building_id: number;
  lat: number;
  lng: number;
}

// 응답의 메타 정보에 대한 타입
export interface MetaData {
  source: string;
  version: string;
  last_at: string; // ISO 8601 형식의 날짜 문자열
}

// 추천기록 가져오기
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

// 요청 본문 전체에 대한 타입
export interface PolygonCategoryRequest {
  polygon: RecommendRequest[];
  category: string;
}

// items 배열 안의 개별 건물 정보 객체 타입
export interface BuildingItem {
  buildingId: number;
  lat: string; // JSON 데이터에서 문자열이므로 string으로 지정
  lng: string; // JSON 데이터에서 문자열이므로 string으로 지정
  favorite: boolean;
  categories: RecommendationItem[]; // CategoryInfo 타입의 배열
}

// 최상위 응답 객체 타입
export interface BuildingListResponse {
  items: BuildingItem[]; // BuildingItem 타입의 배열
}

export interface DeleteCategoriesRequest {
  categories: string[];
}
