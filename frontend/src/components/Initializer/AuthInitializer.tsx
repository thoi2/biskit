// /components/AuthInitializer.tsx
'use client'; // useEffect, useRef 등 클라이언트 훅을 사용하므로 필수

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { checkAuthStatusAPI } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

export default function AuthInitializer() {
  // 1. 상태 변경에 필요한 '도구'들을 미리 준비합니다.
  const { login } = useAuthStore(); // Zustand 스토어의 login 액션
  const queryClient = useQueryClient(); // React Query의 '뇌'

  // 2. useEffect가 두 번 실행되는 것을 방지하기 위한 '메모장'
  // React 18의 StrictMode에서는 개발 환경에서 컴포넌트를 두 번 렌더링하여 잠재적 버그를 찾습니다.
  // 이로 인해 useEffect도 두 번 실행될 수 있으므로, useRef를 사용해 API 호출이 딱 한 번만 일어나도록 보장합니다.
  const isInitialized = useRef(false);

  useEffect(() => {
    // 3. 이미 초기화가 실행되었다면, 즉시 종료 (두 번째 실행 방지)
    if (isInitialized.current) return;
    
    // 4. 처음 실행될 때, '실행했음'이라고 메모장에 기록합니다.
    isInitialized.current = true;

    // 5. 비동기 초기화 함수를 정의하고 실행합니다.
    const initializeAuth = async () => {
      try {
        // 6. [시도] 서버에 인증 상태 확인 API를 호출합니다. (성공 경로)
        const user = await checkAuthStatusAPI();
        
        // 7. [성공 시] 받아온 사용자 정보를 React Query 캐시에 미리 주입합니다.
        // 이렇게 하면 UserProfile 컴포넌트가 렌더링될 때, 또 API를 호출할 필요 없이
        // 캐시된 데이터를 바로 사용하여 화면을 더 빠르게 그릴 수 있습니다.
        queryClient.setQueryData(['user', 'profile'], user);
        
        // 8. [성공 시] Zustand의 로그인 상태를 true로 변경하여, 앱 전체에 로그인 상태임을 알립니다.
        login();

      } catch (error) {
        // 9. [실패 시] 아무것도 하지 않습니다.
        // 쿠키가 없거나 만료되어 API 호출이 실패하는 것은 정상적인 상황입니다.
        // 이 경우, isLoggedIn 상태는 기본값인 false로 유지됩니다.
      }
    };
    
    initializeAuth();
  }, [login, queryClient]); // 의존성 배열

  // 10. 이 컴포넌트는 UI를 렌더링하지 않으므로 null을 반환합니다.
  return null;
}