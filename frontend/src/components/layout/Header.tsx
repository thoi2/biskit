// 📁 src/components/layout/Header.tsx

'use client';

import Link from 'next/link';
import Button from '@/components/ui/Button/Button'
import Image from 'next/image';

export default function Header() {
  const handleLogin = () => {
    alert('로그인 처리!');
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
          <div className="flex items-center gap-x-2">
            <Button variant="secondary" onClick={handleLogin}>
              Sign In
            </Button>
            <Button variant="primary">
              Get Started
            </Button>
            <Link href="/my-page" aria-label="profile" className="rounded-full overflow-hidden shadow-md">
              <Image
                src="/2.png"
                alt="Profile"
                width={32}
                height={32}
                priority
              />
            </Link>
          </div>
        </div>
      </header>
      {/* ========== END HEADER ========== */}
    </>
  );
}