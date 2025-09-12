// components/AuthInitializer.tsx
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { getCookie } from 'cookies-next'; // 예시: cookies-next 라이브러리 사용

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { login } = useAuthStore();

  useEffect(() => {
    // 컴포넌트가 마운트될 때 딱 한 번 실행됩니다.
    // 'accessToken' 쿠키가 있는지 확인합니다.
    const accessToken = getCookie('accessToken');

    if (accessToken) {
      // 토큰이 있다면, 로그인 상태를 true로 설정합니다.
      login();
    }
  }, );

  return <>{children}</>;
}