'use client';

import Link from 'next/link';
import Button from '@/components/ui/Button/Button';
import Image from 'next/image';
import { useAuthStore } from '@/store/authStore'; // 1. authStore 임포트
import { useUserQuery } from '@/hooks/useUserQuery'; // 2. useUserQuery 훅 임포트
import { useQueryClient } from '@tanstack/react-query'; // 3. 쿼리 클라이언트 훅 임포트
import { logoutAPI } from '@/lib/api'; // 4. 로그인/로그아웃 API 임포트

export default function Header() {
  // Zustand 스토어에서는 로그인 상태와 상태 변경 함수만 가져옵니다.
  const { isLoggedIn, logout: logoutAction } = useAuthStore();
  
  // React Query 훅에서는 서버 데이터(user)와 로딩 상태 등을 가져옵니다.
  const { data: user } = useUserQuery();
  
  // React Query의 캐시를 직접 제어하기 위해 쿼리 클라이언트를 가져옵니다.
  const queryClient = useQueryClient();

  const handleLogin = () => {
    const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    // 프론트엔드의 콜백 주소 (반드시 Google Cloud Console에 등록된 리디렉션 URI와 일치해야 함)
    const GOOGLE_REDIRECT_URI = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;

    // 구글 OAuth 2.0 인증 페이지로 리디렉션할 URL 생성
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${GOOGLE_REDIRECT_URI}&response_type=code&scope=openid email profile&access_type=offline&prompt=consent`;

    // 생성된 URL로 페이지를 이동시킴
    window.location.href = googleAuthUrl;
  };
  
  // 로그아웃 핸들러: API 호출 후 상태와 캐시를 정리합니다.
  const handleLogout = async () => {
    try {
      await logoutAPI();
      // 1. React Query 캐시에서 사용자 정보 제거
      queryClient.removeQueries({ queryKey: ['user', 'profile'] });
      // 2. Zustand 스토어의 상태를 '로그아웃'으로 변경
      logoutAction();
    } catch (error) {
      alert('로그아웃에 실패했습니다.');
    }
  };

  return (
    <>
    {/* <header className="text-white p-6 shadow-lg border-b border-orange-600/20 bg-gradient-to-r from-amber-600 to-orange-600">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <div className="text-right">
                    <p className="text-sm text-orange-100">
                      안녕하세요,
                    </p>
                    <p className="font-semibold text-white">
                      {user.name || user.email?.split("@")[0]}님
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={signOut}
                    className="text-white hover:bg-white/20 border border-white/40 backdrop-blur-sm transition-all duration-300 font-medium bg-transparent"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <Button
                  onClick={onLogin}
                  variant="ghost"
                  className="text-white hover:bg-white/20 border border-white/40 backdrop-blur-sm"
                >
                  로그인
                </Button>
              )}
            </div>
          </div>
        </header> */}
      <header className="text-white p-6 shadow-lg border-b border-orange-600/20 bg-gradient-to-r from-amber-600 to-orange-600">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          
          <Link
            href="/"
            aria-label="Brand"
            className="font-bold text-4xl tracking-wide"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg border border-orange-500/50 bg-orange-700">
                <span className="text-white font-bold text-lg">🍪</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  BISKIT
                </h1>
                <p className="text-sm font-medium tracking-wider text-orange-100">
                  BUSINESS START KIT
                </p>
              </div>
            </div>
          </Link>

          {/* isLoggedIn (from Zustand)으로 전체적인 UI 분기 처리, 
            user (from React Query)로 실제 데이터 표시 
          */}
          {isLoggedIn && user ? (
            <div className="flex items-center gap-x-4">
              <Link href="/my-page" aria-label="profile" className="font-semibold">
                {user.name}
              </Link>
              <Link href="/my-page" aria-label="profile" className="rounded-full overflow-hidden shadow-md">
                <Image
                  src={user.profileImageUrl}
                  alt="/2.png"
                  width={32}
                  height={32}
                  priority
                />
              </Link>
              <Button variant="secondary" onClick={handleLogout}> {/* 수정된 로그아웃 핸들러 연결 */}
                Logout
              </Button>
            </div>
            
          ) : (
            <div className="flex items-center gap-x-2">
              <Button variant="secondary" onClick={handleLogin}> {/* 수정된 로그인 핸들러 연결 */}
                Sign In
              </Button>
              <Button variant="primary">
                Get Started
              </Button>
            </div>
              )}
        </div>
      </header>
    </>
  );
}