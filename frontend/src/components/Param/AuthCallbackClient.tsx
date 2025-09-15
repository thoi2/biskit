// components/Param/AuthCallbackClient.tsx

'use client'; // 클라이언트 컴포넌트임을 명시합니다.

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { googleLoginAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useQueryClient } from '@tanstack/react-query';

export default function AuthCallbackClient() {
  // page.tsx에 있던 모든 훅을 이곳으로 이동합니다.
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useAuthStore();
  const queryClient = useQueryClient();

  // page.tsx에 있던 useEffect 로직을 그대로 가져옵니다.
  useEffect(() => {
    const authCode = searchParams.get('code');

    if (authCode) {
      const handleGoogleLogin = async (code: string) => {
        try {
          const user = await googleLoginAPI(code);
          queryClient.setQueryData(['user', 'profile'], user);
          login();
          router.push('/');
        } catch (error) {
          console.error('구글 로그인에 실패했습니다:', error);
          alert('로그인에 실패했습니다. 다시 시도해주세요.');
          router.push('/'); // 실패 시에도 홈으로 보낼지, 로그인 페이지로 보낼지 결정
        }
      };

      handleGoogleLogin(authCode);
    }
  }, [searchParams, router, login, queryClient]);

  // 로직이 실행되는 동안 보여줄 UI
  return <div>로그인 정보를 확인 중입니다...</div>;
}