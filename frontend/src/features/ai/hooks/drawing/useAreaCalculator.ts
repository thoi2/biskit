// src/features/map/hooks/useAreaCalculator.ts
import { useCallback } from 'react';

interface PolygonPoint {
    lat: number;
    lng: number;
}

export function useAreaCalculator() {
    const calculatePolygonArea = useCallback((polygon: PolygonPoint[]): number => {
        if (polygon.length < 3) return 0;

        let area = 0;
        const n = polygon.length;

        for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            area += polygon[i].lng * polygon[j].lat;
            area -= polygon[j].lng * polygon[i].lat;
        }

        area = Math.abs(area) / 2;
        return area;
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
