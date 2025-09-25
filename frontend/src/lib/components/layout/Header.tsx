'use client';

import Link from 'next/link';
import Button from '@/lib/components/ui/Button/Button';
import Image from 'next/image';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { logoutAPI } from '@/features/auth/api/authApi';
import { User, LogOut, MessageCircle, Zap } from 'lucide-react';
import { useState } from 'react';
import { ChatMainModal } from '@/features/chat/components/ChatMainModal';

export default function Header() {
  const { user, logout } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);

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

  // 🚀 AI 테스트 함수 추가
  // 🚀 AI 테스트 함수 수정
  const testAI = async () => {
    console.log('🧪 AI API 테스트 시작...');

    try {
      // ✅ 올바른 백엔드 URL로 수정
      const response = await fetch(
        'http://localhost:8080/api/v1/user/industry/ai-recommend',
        // 'http://j13a101.p.ssafy.io//api/v1/user/industry/ai-recommend',
        {
          method: 'POST',
          credentials: 'include', // 쿠키 포함
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            surveyResponses: [
              { questionId: 1, selectedOptions: [1, 2] },
              { questionId: 2, selectedOptions: [3] },
              { questionId: 3, selectedOptions: [1, 4] },
            ],
          }),
        },
      );

      console.log('📊 응답 상태:', response.status);
      console.log(
        '🔍 CORS 헤더:',
        response.headers.get('Access-Control-Allow-Origin'),
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ AI 추천 성공!', data);
        alert(
          `AI 추천 성공! ${
            data.data?.recommendations?.length || 0
          }개 업종 추천`,
        );
      } else {
        const errorText = await response.text();
        console.log('❌ AI 추천 실패:', response.status, errorText);
        alert(`AI 추천 실패: ${response.status}`);
      }
    } catch (error) {
      console.log('🚨 네트워크 에러:', error);
      // 에러가 Error 객체인지 확인하는 타입 가드 추가
      if (error instanceof Error) {
        alert('네트워크 에러: ' + error.message);
      } else {
        // Error 객체가 아닌 경우
        alert('알 수 없는 오류가 발생했습니다.');
      }
    }
  };

  return (
    <header style={{ backgroundColor: '#654321' }} className="shadow-lg">
      <div className="w-full px-6">
        <div className="flex items-center justify-between py-4">
          {/* 로고 - 완전 왼쪽 고정 */}
          <Link href="/" className="flex items-center gap-4 group">
            {/* 정말 예쁜 비스킷 아이콘 */}
            <div className="relative">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg group-hover:rotate-12 transition-all duration-300 border-2 border-yellow-600"
                style={{ backgroundColor: '#F4A460' }}
              >
                {/* 귀여운 비스킷 얼굴 */}
                <div className="relative">
                  {/* 반짝이는 눈 */}
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
                  {/* 웃는 입 */}
                  <div
                    className="w-4 h-2 rounded-b-full"
                    style={{ backgroundColor: '#654321' }}
                  ></div>

                  {/* 자연스러운 초콜릿칩들 */}
                  <div className="absolute -top-1.5 -left-1.5 w-1.5 h-1.5 bg-amber-800 rounded-full"></div>
                  <div className="absolute top-0.5 right-1 w-1 h-1 bg-orange-900 rounded-full"></div>
                  <div className="absolute bottom-0.5 -left-0.5 w-1 h-1 bg-yellow-800 rounded-full"></div>
                  <div className="absolute -bottom-0.5 right-0.5 w-1.5 h-1.5 bg-amber-900 rounded-full"></div>
                  <div className="absolute top-1.5 -right-1 w-0.5 h-0.5 bg-orange-800 rounded-full"></div>
                </div>

                {/* 반짝이는 하이라이트 */}
                <div className="absolute top-2 left-2 w-3 h-2 bg-white/30 rounded-full blur-sm"></div>
              </div>

              {/* 귀여운 크럼블 효과 */}
              <div className="absolute -top-1 -right-2 w-2 h-2 bg-yellow-400 rounded-full opacity-80 animate-pulse"></div>
              <div className="absolute -bottom-2 -left-1 w-1.5 h-1.5 bg-orange-400 rounded-full opacity-70"></div>
            </div>

            {/* 깔끔한 브랜드명 */}
            <div>
              <h1 className="text-2xl font-bold text-white tracking-wide">
                BISKIT
              </h1>
              <p className="text-sm text-orange-200 font-medium -mt-1 hidden sm:block">
                BUSINESS START KIT
              </p>
            </div>
          </Link>

          {/* 네비게이션 - 완전 오른쪽 고정 */}
          <div className="flex items-center gap-4">
            {/* 🚀 AI 테스트 버튼 (로그인된 사용자에게만 표시) */}
            {user && (
              <Button
                onClick={testAI}
                className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-2 font-medium shadow-md border border-purple-500"
              >
                <Zap className="w-4 h-4" />
                <span className="hidden sm:inline">AI테스트</span>
              </Button>
            )}

            {user ? (
              <>
                {/* 사용자 정보 */}
                <div className="text-right hidden md:block">
                  <p className="text-sm text-orange-200">환영합니다</p>
                  <Link
                    href="/my-page"
                    className="text-lg font-semibold text-white hover:text-orange-200 transition-colors"
                  >
                    {user.username}님
                  </Link>
                </div>

                {/* 채팅 아이콘 */}
                <Button
                  onClick={() => setIsChatOpen(true)}
                  className="bg-[#8B4513] hover:bg-amber-800 text-white p-3 rounded-lg transition-all duration-200 shadow-md border border-amber-700"
                >
                  <MessageCircle className="w-5 h-5" />
                </Button>

                {/* 프로필 이미지 */}
                <Link href="/my-page" className="group">
                  <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-orange-300 group-hover:ring-orange-200 transition-all shadow-lg">
                    <Image
                      src={user.profileImageUrl}
                      alt="프로필"
                      width={40}
                      height={40}
                      priority
                      className="object-cover"
                    />
                  </div>
                </Link>

                {/* 로그아웃 버튼 */}
                <Button
                  onClick={handleLogout}
                  className="bg-[#8B4513] hover:bg-amber-800 text-white text-sm px-4 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-2 font-medium shadow-md border border-amber-700"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">로그아웃</span>
                </Button>
              </>
            ) : (
              <Button
                onClick={handleLogin}
                className="bg-orange-50 hover:bg-orange-100 text-orange-900 font-bold text-sm px-6 py-3 rounded-lg shadow-lg transition-all duration-200 flex items-center gap-2 border-2 border-orange-100 hover:border-orange-200"
              >
                <User className="w-4 h-4" />
                <span>로그인</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 채팅 모달 */}
      {user && (
        <ChatMainModal
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />
      )}
    </header>
  );
}
