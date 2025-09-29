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
      {/* 전체 배율 75% 적용 (globals.css에서 .app-75 정의) */}
      <body className="app-75" suppressHydrationWarning>
      <Providers>
          {/* h-screen → h-full (배율/브라우저별 vh 계산 이슈 방지) */}
          <div className="h-full flex flex-col overflow-hidden">
              <Header />
              {/* 이미 적용한 min-h-0 유지 */}
              <main className="flex-1 min-h-0 overflow-hidden">
                  {children}
              </main>
          </div>
      </Providers>
      </body>

      </html>
  );
}
