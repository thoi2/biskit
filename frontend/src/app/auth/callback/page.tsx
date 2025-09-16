// /app/auth/callback/page.tsx

import { Suspense } from 'react';
import AuthCallbackClient from '@/components/Param/AuthCallbackClient'; // 경로가 맞는지 확인해주세요.

// 'use client'와 모든 로직을 제거합니다.
export default function AuthCallbackPage() {
  // 이 페이지의 역할은 Suspense로 클라이언트 컴포넌트를 감싸주는 것, 딱 하나입니다.
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthCallbackClient />
    </Suspense>
  );
}