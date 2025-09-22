// lib/store-api.ts
import apiClient from '../../../lib/apiClient';
import type { Store } from '@/features/stores/types/store';
import type { ApiResponse, Bounds, InBoundsRequest } from '@/lib/types/api'; // 🔥 기존 타입 import
import storeCategories from '@/lib/data/store_categories.json';

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

// 🔥 JSON 데이터 타입
type CategoryData = {
    상권업종대분류코드: string;
    상권업종대분류명: string;
    상권업종중분류코드: string;
    상권업종중분류명: string;
    상권업종소분류코드: string;
    상권업종소분류명: string;
}[];

// 🔥 자동으로 코드 → 한글명 매핑 생성
const createCategoryMap = (): Record<string, string> => {
    const map: Record<string, string> = {};

    // JSON 데이터에서 자동 매핑 생성
    (storeCategories as CategoryData).forEach(item => {
        // 소분류코드 → 소분류명 매핑
        map[item.상권업종소분류코드] = item.상권업종소분류명;
    });

    console.log(`📋 카테고리 매핑 생성 완료: ${Object.keys(map).length}개`);
    console.log('매핑 샘플:', Object.entries(map).slice(0, 3));

    return map;
};

// 매핑 생성 (앱 시작할 때 한 번만)
const categoryMap = createCategoryMap();

// MapBounds를 API Bounds로 변환
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

// 🔥 카테고리 코드를 한글명으로 변환
function getCategoryName(bizCategoryCode: string): string {
    const koreanName = categoryMap[bizCategoryCode];

    if (!koreanName) {
        console.warn(`⚠️  매핑되지 않은 업종코드: ${bizCategoryCode}`);
    }

    return koreanName || bizCategoryCode;
}

// API Store를 UI Store로 변환
function enrichStoreData(apiStore: ApiStore): Store {
    const displayName = apiStore.branchName
        ? `${apiStore.storeName} ${apiStore.branchName}`
        : apiStore.storeName;

    const categoryName = getCategoryName(apiStore.bizCategoryCode);

    return {
        ...apiStore,
        displayName,
        categoryName,
        hidden: false,
    };
}

/**
 * 지도 경계 내에 있는 매장 목록을 조회하는 API 함수
 */
export const getStoresInBoundsAPI = async (bounds: Bounds): Promise<Store[]> => {
    console.log('🔍 API 요청 시작:', bounds);

    const requestBody: InBoundsRequest = { bounds };

    try {
        const response = await apiClient.post<ApiResponse<ApiStore[]>>(
            '/store/in-bounds',
            requestBody,
        );

        if (!response.data.success) {
            throw new Error(`API 요청 실패: ${response.data.status}`);
        }

        console.log('✅ API 응답 성공:', response.data.body.length, '개 상가');

        // API 응답 데이터를 UI용 Store 타입으로 변환
        const enrichedData = response.data.body.map(enrichStoreData);

        console.log('🔄 변환된 데이터 샘플:');
        enrichedData.slice(0, 2).forEach(store => {
            console.log(`  - ${store.displayName} (${store.categoryName})`);
        });

        return enrichedData;

    } catch (error) {
        console.error('❌ API 요청 실패:', error);
        throw new Error('상가 데이터를 가져오는데 실패했습니다.');
    }
};
