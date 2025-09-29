// src/features/map/hooks/useAreaCalculator.ts
import { useCallback } from 'react';

interface PolygonPoint {
    lat: number;
    lng: number;
}

export function useAreaCalculator() {
    const calculatePolygonArea = useCallback((polygon: PolygonPoint[]): number => {
        console.log('🟢 면적 계산 함수 호출됨!', polygon.length, '개 점');

        if (polygon.length < 3) {
            console.log('⚠️ 폴리곤 점이 3개 미만:', polygon.length);
            return 0;
        }

        console.log('📐 면적 계산 시작 - 좌표들:', polygon.map((p, i) => `${i}: (${p.lat.toFixed(6)}, ${p.lng.toFixed(6)})`));

        // ✅ 사각형의 경우 더 정확한 계산
        if (polygon.length === 4) {
            console.log('📐 사각형 면적 계산');

            const p1 = polygon[0]; // SW
            const p2 = polygon[1]; // SE
            const p3 = polygon[2]; // NE
            const p4 = polygon[3]; // NW

            console.log('📐 사각형 꼭짓점들:', {
                p1: `SW (${p1.lat.toFixed(6)}, ${p1.lng.toFixed(6)})`,
                p2: `SE (${p2.lat.toFixed(6)}, ${p2.lng.toFixed(6)})`,
                p3: `NE (${p3.lat.toFixed(6)}, ${p3.lng.toFixed(6)})`,
                p4: `NW (${p4.lat.toFixed(6)}, ${p4.lng.toFixed(6)})`
            });

            // 위도 차이 (미터)
            const latDiff = Math.abs(p3.lat - p1.lat);
            const latMeters = latDiff * 111000; // 위도 1도 ≈ 111km

            // 경도 차이 (미터) - 위도에 따른 보정
            const lngDiff = Math.abs(p3.lng - p1.lng);
            const avgLat = (p1.lat + p3.lat) / 2;
            const lngMeters = lngDiff * 111000 * Math.cos(avgLat * Math.PI / 180);

            const areaSquareMeters = latMeters * lngMeters;

            console.log('📐 사각형 면적 계산 상세:', {
                latDiff: latDiff.toFixed(8),
                lngDiff: lngDiff.toFixed(8),
                latMeters: latMeters.toFixed(2),
                lngMeters: lngMeters.toFixed(2),
                areaSquareMeters: areaSquareMeters.toFixed(2),
                areaHectares: (areaSquareMeters / 10000).toFixed(4),
                areaKm2: (areaSquareMeters / 1000000).toFixed(6)
            });

            console.log('✅ 사각형 최종 면적:', areaSquareMeters, '제곱미터');
            return areaSquareMeters;
        }

        // ✅ 일반 폴리곤의 경우 Shoelace 공식
        console.log('📐 일반 폴리곤 면적 계산 (Shoelace 공식)');
        let area = 0;
        const n = polygon.length;

        for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            area += polygon[i].lng * polygon[j].lat;
            area -= polygon[j].lng * polygon[i].lat;
        }

        area = Math.abs(area) / 2;

        // 위경도를 제곱미터로 변환 (대략적)
        const areaSquareMeters = area * 111000 * 111000;

        console.log('📐 일반 폴리곤 면적 계산 상세:', {
            rawArea: area.toFixed(8),
            areaSquareMeters: areaSquareMeters.toFixed(2),
            areaHectares: (areaSquareMeters / 10000).toFixed(4),
            areaKm2: (areaSquareMeters / 1000000).toFixed(6)
        });

        console.log('✅ 폴리곤 최종 면적:', areaSquareMeters, '제곱미터');
        return areaSquareMeters;
    }, []);

    const isPointInPolygon = useCallback((point: PolygonPoint, polygon: PolygonPoint[]) => {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            if (
                polygon[i].lat > point.lat !== polygon[j].lat > point.lat &&
                point.lng < ((polygon[j].lng - polygon[i].lng) * (point.lat - polygon[i].lat)) / (polygon[j].lat - polygon[i].lat) + polygon[i].lng
            ) {
                inside = !inside;
            }
        }
        return inside;
    }, []);

    return {
        calculatePolygonArea,
        isPointInPolygon
    };
}
