// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css'; // 전역 CSS
import Header from '@/components/layout/Header';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'BISKIT',
  description: 'Business Start Kit',
};

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
