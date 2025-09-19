// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import Header from '@/lib/components/layout/Header';
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
    <html lang="ko" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          <div className="h-screen flex flex-col">
            {' '}
            {/* 👈 전체 레이아웃 컨테이너 */}
            {/* 헤더 - 상단 고정 */}
            <Header />
            {/* 메인 콘텐츠 - 나머지 공간 차지 */}
            <main className="flex-1 overflow-hidden">
              {' '}
              {/* 👈 flex-1로 나머지 공간 차지 */}
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
