// 📁 src/components/layout/Header.tsx

'use client';

import Link from 'next/link';
import Button from '@/components/ui/Button/Button'
import Image from 'next/image';
import { useUserStore } from '@/store/user';
import {User} from '@/types/user';

export default function Header() {
  
  const handleLogin = () => {
    setUser(dummyUser);
    alert('로그인 처리!');
  };

  const { isLoggedIn, user, setUser, logout } = useUserStore();

  const dummyUser: User = {
    id: 1,
    provider_user_id: '12345',
    email: 'test@example.com',
    nickname: '홍길동',
    created_at: Date.now(),
  };

  return (
    <>
      <header className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md z-50">
      {/* 1. Topbar와 메인 바를 하나의 컨테이너로 통합합니다. */}
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* 왼쪽: Brand 로고 */}
          <Link
            href="/"
            aria-label="Brand"
            className="font-bold text-4xl tracking-wide"
          >
            버텨넷
          </Link>

          {/* 사용자 메뉴 (Sign In, Get Started 등) */}
          
          {isLoggedIn && user ? (
            <div className="flex items-center gap-x-4">
              <Link href="/my-page" aria-label="profile" className="font-semibold">
                {user.nickname}
              </Link>
              <Link href="/my-page" aria-label="profile" className="rounded-full overflow-hidden shadow-md">
                <Image
                  src="/2.png"
                  alt="Profile"
                  width={32}
                  height={32}
                  priority
                />
              </Link>
              <Button variant="secondary" onClick={logout}>
                Logout
              </Button>
            </div>
            
            ) : (
            <div className="flex items-center gap-x-2">
              <Button variant="secondary" onClick={handleLogin}>
                Sign In
              </Button>
              <Button variant="primary">
                Get Started
              </Button>
            </div>
             )}
        </div>
      </header>
      {/* ========== END HEADER ========== */}
    </>
  );
}