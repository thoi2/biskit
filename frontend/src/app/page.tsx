'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Sidebar } from '@/lib/components/layout/Sidebar';
import { MapArea } from '@/features/map/components/MapArea';
import { LoadingScreen } from '@/lib/components/ui/LoadingScreen';
import { useBiskitData } from '@/features/stores/hooks/useBiskitData';

export default function HomePage() {
    const { user, loading } = useAuth();
    const { searchError, handlers } = useBiskitData(user);

    // 🎯 설문조사 모달 상태 추가
    const [surveyModalOpen, setSurveyModalOpen] = useState<boolean>(false);

    // 🎯 useEffect를 최상단으로 이동 (Hook 순서 유지)
    useEffect(() => {
        // 로딩 중이면 이벤트 리스너 등록하지 않음
        if (loading) return;

        const handleOpenSurvey = () => setSurveyModalOpen(true);

        window.addEventListener('openSurveyModal', handleOpenSurvey);

        return () => {
            window.removeEventListener('openSurveyModal', handleOpenSurvey);
        };
    }, [loading]);

    // 로딩 체크를 useEffect 아래로 이동
    if (loading) return <LoadingScreen />;

    return (
        <div className="h-full flex overflow-hidden min-h-0">
            <Sidebar />
            <div className="flex-1 h-full min-h-0">
                <MapArea />
            </div>
        </div>
    );
}
