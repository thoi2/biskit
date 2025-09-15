// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/auth-provider';
import { Header } from '@/components/layout/Header';

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
      <AuthProvider>
        <Header />  {/* 🔥 모든 페이지에 Header 자동 적용 */}
        <main>{children}</main>  {/* 🔥 각 페이지 내용이 여기 들어감 */}
      </AuthProvider>
      </body>
      </html>
  );
}
