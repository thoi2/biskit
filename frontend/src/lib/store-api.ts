// lib/store-api.ts
import apiClient from './apiClient';
import type { Store } from '@/lib/types/store';

// API 타입들을 파일 내에서 정의
interface Location {
    lat: number;
    lng: number;
}

interface Bounds {
    southwest: Location;
    northeast: Location;
}

interface InBoundsRequest {
    bounds: Bounds;
}

interface ApiResponse<T> {
    success: boolean;
    status: number;
    timestamp: string;
    body: T;
}

// API 응답에서 받는 Store 타입 (UI 전용 필드 제외)
interface ApiStore {
    id: number;
    storeName: string;
    branchName: string;
    bizCategoryCode: string;
    dongCode: number;
    roadAddress: string;
    lat: number;
    lng: number;
}

// MapBounds를 API Bounds로 변환하는 헬퍼 함수
export function mapBoundsToApiBounds(mapBounds: {
    sw: { lat: number; lng: number };
    ne: { lat: number; lng: number };
}): Bounds {
    return {
        southwest: {
            lat: mapBounds.sw.lat,
            lng: mapBounds.sw.lng,
        },
        northeast: {
            lat: mapBounds.ne.lat,
            lng: mapBounds.ne.lng,
        },
    };
}

// 카테고리 코드를 한글 이름으로 변환하는 함수
function getCategoryName(bizCategoryCode: string): string {
    const categoryMap: Record<string, string> = {
        'Q12903': '커피전문점',
        'I56111': '패스트푸드',
        'I56121': '한식음식점',
        'G47211': '편의점',
    };
    return categoryMap[bizCategoryCode] || bizCategoryCode;
}

// API Store를 UI Store로 변환하는 함수
function enrichStoreData(apiStore: ApiStore): Store {
    return {
        ...apiStore,
        displayName: apiStore.branchName
            ? `${apiStore.storeName} ${apiStore.branchName}`
            : apiStore.storeName,
        categoryName: getCategoryName(apiStore.bizCategoryCode),
        hidden: false,
    };
}

/**
 * 지도 경계 내에 있는 매장 목록을 조회하는 API 함수
 */
export const getStoresInBoundsAPI = async (
    bounds: Bounds,
): Promise<Store[]> => {
    const requestBody: InBoundsRequest = { bounds };

    try {
        const response = await apiClient.post<ApiResponse<ApiStore[]>>(
            '/api/v1/store/in-bounds',
            requestBody,
        );

        if (!response.data.success) {
            throw new Error(`API 요청 실패: ${response.data.status}`);
        }

        // API 응답 데이터를 UI용 Store 타입으로 변환
        return response.data.body.map(enrichStoreData);

    } catch (error) {
        console.error('getStoresInBoundsAPI 오류:', error);
        throw new Error('상가 데이터를 가져오는데 실패했습니다.');
    }
};
