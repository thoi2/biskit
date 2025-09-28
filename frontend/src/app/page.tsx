'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Sidebar } from '@/lib/components/layout/Sidebar';
import { MapArea } from '@/features/map/components/MapArea';
import { LoadingScreen } from '@/lib/components/ui/LoadingScreen';
import { ChatSidebar } from '@/features/chat/components/ChatSidebar';

export default function HomePage() {
    const { user, loading } = useAuth();
    const [surveyModalOpen, setSurveyModalOpen] = useState<boolean>(false);

    useEffect(() => {
        if (loading) return;

        const handleOpenSurvey = () => setSurveyModalOpen(true);
        window.addEventListener('openSurveyModal', handleOpenSurvey);

        return () => {
            window.removeEventListener('openSurveyModal', handleOpenSurvey);
        };
    }, [loading]);

    if (loading) return <LoadingScreen />;

    return (
        <div className="h-full flex overflow-hidden min-h-0">
            <Sidebar />
            <div className="flex-1 h-full min-h-0 min-w-0">  {/* ← min-w-0 추가 */}
                <MapArea />
            </div>
            <ChatSidebar />
        </div>

    );
}
