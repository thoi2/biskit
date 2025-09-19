'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { googleLoginAPI } from '@/features/auth/api/authApi';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export default function AuthCallbackClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useAuthStore();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading',
  );
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const authCode = searchParams.get('code');

    if (!authCode) {
      setErrorMessage('유효하지 않은 접근입니다. 로그인 코드가 없습니다.');
      setStatus('error');
      return;
    }

    const processLogin = async (code: string) => {
      try {
        const user = await googleLoginAPI(code);
        queryClient.setQueryData(['user', 'profile'], user);
        login();
        setStatus('success');
        setTimeout(() => router.push('/'), 1500); // 1.5초 후 홈으로 이동
      } catch (error) {
        console.error('Google login failed:', error);
        setErrorMessage(
          '로그인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        );
        setStatus('error');
      }
    };

    processLogin(authCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Card className="w-full max-w-sm text-center p-8 shadow-lg">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-semibold">로그인 중...</h2>
          <p className="text-muted-foreground mt-2">
            사용자 정보를 안전하게 확인하고 있습니다.
          </p>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Card className="w-full max-w-sm text-center p-8 shadow-lg">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-red-600">로그인 실패</h2>
          <p className="text-muted-foreground mt-2">{errorMessage}</p>
          <Button onClick={() => router.push('/')} className="mt-8 w-full">
            홈으로 돌아가기
          </Button>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Card className="w-full max-w-sm text-center p-8 shadow-lg">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-green-600">
            로그인 성공!
          </h2>
          <p className="text-muted-foreground mt-2">
            잠시 후 메인 페이지로 이동합니다.
          </p>
        </Card>
      </div>
    );
  }

  return null;
}
