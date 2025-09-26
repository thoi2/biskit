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
        <div className="h-full bg-gradient-warm flex overflow-hidden">
            <Sidebar />

            <div className="flex-1 h-full">
                <MapArea />
            </div>

            {/* 검색 오류 표시 */}
            {searchError && (
                <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50">
                    <div className="flex items-center justify-between">
                        <span>{searchError}</span>
                        <button
                            onClick={() =>
                                handlers.handleClearResults && handlers.handleClearResults()
                            }
                            className="ml-2 text-white hover:text-gray-200"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            {/* 🎯 설문조사 모달 - 컴포넌트 생성 후 주석 해제 */}
            {/* {user && (
        <SurveyModal
          open={surveyModalOpen}
          onClose={() => setSurveyModalOpen(false)}
        />
      )} */}

            {/* 임시 모달 */}
            {surveyModalOpen && user && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h2 className="text-xl font-bold mb-4">설문조사 모달</h2>
                        <p className="mb-4">여기에 설문조사 컴포넌트가 들어갑니다</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setSurveyModalOpen(false)}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
