export interface MapBounds {
  sw: { lat: number; lng: number };
  ne: { lat: number; lng: number };
}

// 마커 표시용 통합 아이템 인터페이스
export interface MapMarkerItem {
  id: string;
  name: string;
  category?: string;
  address?: string;
  coordinates: { lat: number; lng: number };
  type: 'store' | 'recommendation' | 'favorite';
  closureProbability?: number;
  riskLevel?: 'low' | 'medium' | 'high';
  hidden?: boolean;
  originalData?: any;
}
export interface FavoriteLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category?: string;
}

export interface MarkerProps {
  map: any;
  onMarkerClick?: (data: any) => void;
}