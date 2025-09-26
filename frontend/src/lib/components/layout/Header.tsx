'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Button from '@/lib/components/ui/Button/Button';
import Image from 'next/image';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { logoutAPI } from '@/features/auth/api/authApi';
import { User, LogOut, ChevronDown, Sparkles } from 'lucide-react';
import { MessageCircle } from 'lucide-react';
import IndustryRecommendationPanel from '@/features/survey/components/IndustryRecommendationPanel';
import SurveyModal from '@/features/survey/components/SurveyModal';
import { ChatMainModal } from '@/features/chat/components/ChatMainModal';

export default function Header() {
  const { user, isLoggedIn, logout } = useAuth();
  const [showPanel, setShowPanel] = useState<boolean>(false);
  const [showSurveyModal, setShowSurveyModal] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  // ✅ Hydration 문제 해결
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLogin = () => {
    const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const GOOGLE_REDIRECT_URI = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${GOOGLE_REDIRECT_URI}&response_type=code&scope=openid email profile&access_type=offline&prompt=consent`;
    window.location.href = googleAuthUrl;
  };

  const handleLogout = async () => {
    try {
      await logoutAPI();
      logout();
    } catch (error) {
      alert('로그아웃에 실패했습니다.');
    }
  };

  const handleTogglePanel = () => {
    setShowPanel(!showPanel);
  };

  return (
    <>
      <header style={{ backgroundColor: '#654321' }} className="shadow-lg">
        <div className="w-full px-6">
          <div className="flex items-center justify-between py-4">
            {/* 로고 */}
            <Link href="/" className="flex items-center gap-4 group">
              <div className="relative">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg group-hover:rotate-12 transition-all duration-300 border-2 border-yellow-600"
                  style={{ backgroundColor: '#F4A460' }}
                >
                  <div className="relative">
                    <div className="flex gap-2 mb-1.5">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: '#654321' }}
                      ></div>
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: '#654321' }}
                      ></div>
                    </div>
                    <div
                      className="w-4 h-2 rounded-b-full"
                      style={{ backgroundColor: '#654321' }}
                    ></div>
                    <div className="absolute -top-1.5 -left-1.5 w-1.5 h-1.5 bg-amber-800 rounded-full"></div>
                    <div className="absolute top-0.5 right-1 w-1 h-1 bg-orange-900 rounded-full"></div>
                    <div className="absolute bottom-0.5 -left-0.5 w-1 h-1 bg-yellow-800 rounded-full"></div>
                    <div className="absolute -bottom-0.5 right-0.5 w-1.5 h-1.5 bg-amber-900 rounded-full"></div>
                    <div className="absolute top-1.5 -right-1 w-0.5 h-0.5 bg-orange-800 rounded-full"></div>
                  </div>
                  <div className="absolute top-2 left-2 w-3 h-2 bg-white/30 rounded-full blur-sm"></div>
                </div>
                <div className="absolute -top-1 -right-2 w-2 h-2 bg-yellow-400 rounded-full opacity-80 animate-pulse"></div>
                <div className="absolute -bottom-2 -left-1 w-1.5 h-1.5 bg-orange-400 rounded-full opacity-70"></div>
              </div>

              <div>
                <h1 className="text-2xl font-bold text-white tracking-wide">
                  BISKIT
                </h1>
                <p className="text-sm text-orange-200 font-medium -mt-1 hidden sm:block">
                  BUSINESS START KIT
                </p>
              </div>
            </Link>

            {/* 네비게이션 */}
            <div className="flex items-center gap-4">
              {/* ✅ 클라이언트에서만 조건부 렌더링 */}
              {isClient && isLoggedIn && (
                <div className="relative">
                  <button
                    onClick={handleTogglePanel}
                    className="bg-orange-100 hover:bg-orange-200 text-orange-900 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-md border border-orange-200 hover:border-orange-300"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>업종 추천</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        showPanel ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {showPanel && (
                    <div className="absolute top-full right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 p-6 z-50">
                      <IndustryRecommendationPanel />
                      <div className="mt-4 text-center border-t border-gray-200 pt-4">
                        <button
                          onClick={() => setShowPanel(false)}
                          className="text-sm text-gray-500 hover:text-gray-700"
                        >
                          닫기
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ✅ 로그인 상태도 클라이언트에서만 렌더링 */}
              {isClient && isLoggedIn ? (
                <>
                  <div className="text-right hidden md:block">
                    <p className="text-sm text-orange-200">환영합니다</p>
                    <span className="text-lg font-semibold text-white">
                      {user.username}님
                    </span>
                  </div>

                  <Button
                    onClick={() => setIsChatOpen(true)}
                    className="bg-[#8B4513] hover:bg-amber-800 text-white p-3 rounded-lg transition-all duration-200 shadow-md border border-amber-700"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </Button>
                  <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-orange-300 shadow-lg">
                    <Image
                      src={user.profileImageUrl}
                      alt="프로필"
                      width={40}
                      height={40}
                      priority
                      className="object-cover"
                    />
                  </div>

                  <Button
                    onClick={handleLogout}
                    className="bg-[#8B4513] hover:bg-amber-800 text-white text-sm px-4 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-2 font-medium shadow-md border border-amber-700"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">로그아웃</span>
                  </Button>
                </>
              ) : isClient && !isLoggedIn ? (
                <Button
                  onClick={handleLogin}
                  className="bg-orange-50 hover:bg-orange-100 text-orange-900 font-bold text-sm px-6 py-3 rounded-lg shadow-lg transition-all duration-200 flex items-center gap-2 border-2 border-orange-100 hover:border-orange-200"
                >
                  <User className="w-4 h-4" />
                  <span>로그인</span>
                </Button>
              ) : (
                // ✅ 로딩 중 스켈레톤 UI
                <div className="flex items-center gap-4">
                  <div className="w-24 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* 채팅 모달 */}
        {isLoggedIn && (
          <ChatMainModal
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
          />
        )}
      </header>

      {/* 설문 모달 */}
      {showSurveyModal && (
        <SurveyModal
          open={showSurveyModal}
          onClose={() => setShowSurveyModal(false)}
        />
      )}
    </>
  );
}
