'use client';

import Link from 'next/link';
import Button from '@/components/ui/Button/Button';
import Image from 'next/image';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { logoutAPI } from '@/features/auth/api/authApi';
import { User, LogOut } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();

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
            {user ? (
              <>
                {/* 사용자 정보 */}
                <div className="text-right hidden md:block">
                  <p className="text-sm text-orange-200">환영합니다</p>
                  <Link
                    href="/my-page"
                    className="text-lg font-semibold text-white hover:text-orange-200 transition-colors"
                  >
                    {user.name}님
                  </Link>
                </div>

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
    </header>
  );
}
