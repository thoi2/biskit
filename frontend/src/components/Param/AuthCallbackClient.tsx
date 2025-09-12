// components/AuthCallbackClient.tsx

'use client'; // 클라이언트 컴포넌트임을 명시합니다.

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthCallbackClient() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // URL에서 'code' 파라미터를 가져옵니다.
    const code = searchParams.get('code');
    if (code) {
      // 이 코드를 사용하여 백엔드에 로그인 요청을 보내는 로직을 실행합니다.
      console.log('Authorization Code:', code);
      // loginWithCode(code);
    }
  }, [searchParams]);

  return <div>로그인 정보를 확인 중입니다...</div>;
}