// /app/page.tsx
'use client';

import { useAuthStore } from '@/store/authStore';

export default function HomePage() {
  const { isLoggedIn } = useAuthStore();

  return (
    <main style={{ padding: '20px' }}>
      <h1>최종 로그인 구현 예제</h1>
      <p>
        현재 로그인 상태: <strong>{isLoggedIn ? '로그인됨' : '로그아웃됨'}</strong>
      </p>
    </main>
  );
}