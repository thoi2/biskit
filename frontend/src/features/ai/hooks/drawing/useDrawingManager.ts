// src/features/map/hooks/useDrawingManager.ts
import { useRef, useCallback } from 'react';

export function useDrawingManager(map: any, drawingType: string) {
    const drawingManagerRef = useRef<any>(null);

    const initializeDrawingManager = useCallback(() => {
        if (!window.kakao?.maps?.drawing) {
            throw new Error('Kakao Drawing Library가 로드되지 않았습니다.');
        }

        const options = {
            map: map,
            drawingMode: [
                window.kakao.maps.drawing.OverlayType.RECTANGLE,
                window.kakao.maps.drawing.OverlayType.CIRCLE,
                window.kakao.maps.drawing.OverlayType.POLYGON
            ],
            rectangleOptions: {
                draggable: false,
                removable: true,
                editable: false,
                strokeColor: '#2563eb',
                fillColor: '#3b82f6',
                fillOpacity: 0.2
            },
            circleOptions: {
                draggable: false,
                removable: true,
                editable: false,
                strokeColor: '#2563eb',
                fillColor: '#3b82f6',
                fillOpacity: 0.2
            },
            polygonOptions: {
                draggable: false,
                removable: true,
                editable: false,
                strokeColor: '#2563eb',
                fillColor: '#3b82f6',
                fillOpacity: 0.2,
                hintStrokeStyle: 'dash',
                hintStrokeOpacity: 0.5
            }
        };

        drawingManagerRef.current = new window.kakao.maps.drawing.DrawingManager(options);
        return drawingManagerRef.current;
    }, [map]);

    const activateDrawing = useCallback(() => {
        if (!drawingManagerRef.current) return;

        drawingManagerRef.current.cancel();

        const overlayType = drawingType === 'rectangle'
            ? window.kakao.maps.drawing.OverlayType.RECTANGLE
            : drawingType === 'circle'
                ? window.kakao.maps.drawing.OverlayType.CIRCLE
                : window.kakao.maps.drawing.OverlayType.POLYGON;

        drawingManagerRef.current.select(overlayType);
    }, [drawingType]);

    const cleanupDrawingManager = useCallback(() => {
        if (drawingManagerRef.current) {
            try {
                drawingManagerRef.current.cancel();
                drawingManagerRef.current.remove();
                drawingManagerRef.current = null;
            } catch (e) {
                console.warn('드로잉 매니저 정리 실패:', e);
            }
        }
    }, []);

    return {
        drawingManagerRef,
        initializeDrawingManager,
        activateDrawing,
        cleanupDrawingManager
    };
}
