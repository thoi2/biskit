// /app/auth/callback/page.tsx
'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { googleLoginAPI } from '@/lib/api'; // 3단계에서 만들 API 함수
import { useAuthStore } from '@/store/authStore';
import { useQueryClient } from '@tanstack/react-query';

export const dynamic = 'force-dynamic';

export default function AuthCallbackPage() {
  // URL의 쿼리 파라미터를 읽기 위한 훅
  const searchParams = useSearchParams();
  // 페이지 리디렉션을 위한 훅
  const router = useRouter();
  
  // 상태 관리를 위한 훅들
  const { login } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    // URL에서 'code' 파라미터를 추출합니다.
    const authCode = searchParams.get('code');

    // code가 존재할 경우에만 백엔드로 전송하는 로직을 실행합니다.
    if (authCode) {
      const handleGoogleLogin = async (code: string) => {
        try {
          // console.log('구글 로그인 코드:', code)
          // 3단계: 추출한 코드를 백엔드 API로 전송합니다.
          const user = await googleLoginAPI(code);
          // 백엔드에서 로그인 성공 및 쿠키 설정이 완료된 후, 클라이언트 상태를 업데이트합니다.
          queryClient.setQueryData(['user', 'profile'], user);
          login();
          
          // 로그인 성공 후 메인 페이지로 리디렉션합니다.
          router.push('/');

        } catch (error) {
          console.error('구글 로그인에 실패했습니다:', error);
          alert('로그인에 실패했습니다. 다시 시도해주세요.');
          // 실패 시 로그인 페이지로 리디렉션합니다.
          router.push('/');
        }
      };

      handleGoogleLogin(authCode);
    }
  }, [searchParams, router, login, queryClient]);
  
  // 이 페이지는 로직 처리 중임을 사용자에게 보여주는 로딩 화면 역할을 합니다.
  return <div>로그인 처리 중입니다. 잠시만 기다려주세요...</div>;
}