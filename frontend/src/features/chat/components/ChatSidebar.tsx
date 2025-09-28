import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ChatMainModal } from './ChatMainModal';
import { useAuth } from '@/features/auth/hooks/useAuth';

const PANEL_PX = 320; // w-80

export function ChatSidebar() {
    const { user } = useAuth();
    const [mounted, setMounted] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => setMounted(true), []);
    if (!mounted || !user) return null;

    const syncMap = () => {
        window.dispatchEvent(new Event('resize'));
        if (window.currentKakaoMap?.relayout) window.currentKakaoMap.relayout();
    }; // 크기 변경 후 지도 맞춤[web:2][web:12][web:29]

    const toggle = () => {
        setOpen(v => !v);
        requestAnimationFrame(syncMap);
    };

    return (
        <div className="relative flex min-h-0">
            {/* 1) 토글 버튼: 패널 '바깥'에 절대배치, 패널 폭에 따라 right 오프셋 변경 */}
            <button
                onClick={toggle}
                className="
          absolute top-1/2 -translate-y-1/2 z-50
          w-8 h-8 rounded-full border-2 shadow-lg
          bg-blue-600 border-blue-500 text-white hover:bg-blue-700
          transition-all duration-300
        "
                style={{
                    right: open ? `${PANEL_PX + 12}px` : '12px', // 닫힘: 화면 오른쪽 12px, 열림: 패널 바깥 12px[web:41][web:33]
                }}
                aria-label="채팅 열고 닫기"
            >
                {open ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            {/* 2) 채팅 패널: Sidebar와 동일한 폭 전환 패턴 */}
            <div
                className={`
          ${open ? 'w-80' : 'w-0'}
          flex-shrink-0 bg-white/90 backdrop-blur-sm border-l border-blue-200
          overflow-hidden transition-all duration-300 ease-in-out
        `}
                onTransitionEnd={syncMap} // 전환 종료 뒤 한 번 더 보장[web:13][web:2]
            >
                {open && (
                    <div className="h-full flex flex-col min-h-0">
                        <ChatMainModal isOpen={true} onClose={() => setOpen(false)} isPanel={true} />
                    </div>
                )}
            </div>
        </div>
    );
}
