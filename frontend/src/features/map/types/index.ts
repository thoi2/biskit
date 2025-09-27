// src/features/map/types.ts
export interface MapBounds {
  sw: { lat: number; lng: number };
  ne: { lat: number; lng: number };
}

// ✅ MapMarkerItem 통합 타입 (모든 속성 포함)
export interface MapMarkerItem {
  id: string; // ✅ string 타입
  type: 'store' | 'recommendation' | 'favorite' | 'cluster'; // ✅ type 속성
  name: string;
  category?: string;
  address?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  closureProbability?: number; // ✅ AI 추천용 생존율
  originalData?: any; // ✅ 원본 데이터
  hidden?: boolean; // ✅ 숨김 상태

  // 상가 관련 추가 필드
  categoryName?: string;
  bizCategoryCode?: string;
  phone?: string;

  // ✅ AI 추천 관련 추가 필드
  title?: string; // AI 추천 제목
  survivalRate?: number; // 생존율 (closureProbability와 동일하지만 호환성)
  buildingId?: number; // 건물 ID
  isAreaResult?: boolean; // 범위 분석 결과 여부
  source?: 'single' | 'range' | 'db'; // 데이터 출처
  isFavorite?: boolean; // 좋아요 상태
  isHighlighted?: boolean; // 하이라이트 상태

  // 상가 관련 추가 필드
  lat?: number; // coordinates와 별개로 직접 접근용
  lng?: number; // coordinates와 별개로 직접 접근용
  displayName?: string; // 상가 표시명
  storeName?: string; // 상가명
  branchName?: string; // 지점명
  roadAddress?: string; // 도로명 주소
  dongCode?: number; // 동 코드

  // 클러스터 관련
  count?: number; // 클러스터 내 아이템 수
  items?: MapMarkerItem[]; // 클러스터 포함 아이템들

  // 마커 표시 관련
  markerSize?: { width: number; height: number }; // 마커 크기
  zIndex?: number; // Z-인덱스
  color?: string; // 마커 색상

  // 이벤트 관련
  onClick?: () => void; // 클릭 핸들러
  onHover?: () => void; // 호버 핸들러

  // 기타 확장 가능 필드
  [key: string]: any;
}

// ✅ 클러스터 전용 타입 (선택사항)
export interface ClusterMarkerItem extends MapMarkerItem {
  type: 'cluster';
  count: number;
  items: MapMarkerItem[];
  storeCount?: number;
  recommendationCount?: number;
  favoriteCount?: number;
}

// ✅ 상가 마커 전용 타입 (선택사항)
export interface StoreMarkerItem extends MapMarkerItem {
  type: 'store';
  storeName: string;
  categoryName: string;
  roadAddress: string;
  lat: number;
  lng: number;
}

// ✅ AI 추천 마커 전용 타입 (선택사항)
export interface RecommendationMarkerItem extends MapMarkerItem {
  type: 'recommendation';
  buildingId: number;
  survivalRate: number;
  title: string;
  source: 'single' | 'range' | 'db';
  isFavorite?: boolean;
}

// ✅ 지도 이벤트 타입
export interface MapClickEvent {
  lat: number;
  lng: number;
  originalEvent?: any;
}

// ✅ 마커 스타일 타입
export interface MarkerStyle {
  width: number;
  height: number;
  color: string;
  isHighlighted: boolean;
  zIndex: number;
}

// ✅ 좌표 타입 (단순형)
export interface Coordinates {
  lat: number;
  lng: number;
}

// ✅ 지도 상태 타입
export interface MapViewState {
  center: Coordinates;
  level: number;
  bounds: MapBounds | null;
}

// ✅ 마커 필터 타입
export interface MarkerFilter {
  types: ('store' | 'recommendation' | 'favorite')[];
  categories: string[];
  hidden: boolean;
  survivalRateRange?: {
    min: number;
    max: number;
  };
}

// ✅ 검색 결과 타입
export interface SearchResult {
  stores: StoreMarkerItem[];
  recommendations: RecommendationMarkerItem[];
  totalCount: number;
  bounds: MapBounds;
}
