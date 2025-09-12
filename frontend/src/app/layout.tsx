// src/app/layout.tsx

import type { Metadata } from 'next';
import './globals.css'; // 전역 CSS
import Header from '@/components/layout/Header';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'Next.js 라우터 학습',
  description: '파일 시스템 기반 라우팅을 배워봅시다.',
};

// layout 파일은 반드시 children prop을 받아서 렌더링해야 합니다.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <Providers>
          {/* 모든 페이지 상단에 보일 공통 헤더 */}
          <Header />
          {/* 이 children 부분에 각 페이지(page.tsx)의 내용이 렌더링됩니다. */}
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
