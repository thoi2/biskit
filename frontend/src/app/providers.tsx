// /app/providers.tsx

// 1. 'use client';
// Next.js App Router에서 이 컴포넌트가 클라이언트 측에서 렌더링되고 상호작용(useState 등)을 포함한다는 것을 명시합니다.
// Provider 패턴은 본질적으로 클라이언트 사이드 기능이므로 반드시 필요합니다.
'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export default function Providers({ children }: { children: React.ReactNode }) {
  // 2. const [queryClient] = useState(() => new QueryClient({...}));
  // React Query의 모든 캐시 데이터와 설정을 관리하는 '뇌(brain)'인 QueryClient 인스턴스를 생성합니다.
  const [queryClient] = useState(() => new QueryClient({
    // 3. defaultOptions: 앱의 모든 쿼리에 적용될 기본 규칙을 설정합니다.
    defaultOptions: {
      queries: {
        // 3-1. staleTime: 1000 * 60 (1분)
        // API 요청으로 가져온 데이터가 1분 동안은 'fresh(신선한)' 상태로 간주됩니다.
        // 이 시간 동안에는 동일한 데이터를 다시 요청해도 API 호출 없이 캐시된 데이터를 즉시 반환합니다.
        staleTime: 1000 * 60,

        // 3-2. refetchOnWindowFocus: true
        // 사용자가 다른 브라우저 탭을 갔다가 다시 돌아왔을 때, 데이터를 자동으로 다시 가져와 최신 상태를 유지합니다.
        refetchOnWindowFocus: true,

        // 3-3. retry: 0
        // API 요청이 실패했을 때, 자동으로 재시도하지 않습니다. (기본값은 3번 재시도)
        retry: 0,
      },
    },
  }));

  return (
    // 4. <QueryClientProvider client={queryClient}>
    // 위에서 만든 queryClient를 앱 전체에 공급하는 Provider입니다.
    // 이 컴포넌트로 감싸진 모든 자식 컴포넌트들은 useQuery 같은 훅을 통해 queryClient에 접근할 수 있습니다.
    <QueryClientProvider client={queryClient}>
      
      {/* 5. {children}
          layout.tsx에서 Providers 컴포넌트가 감싸고 있는 모든 자식 요소들(실제 페이지 컴포넌트들)이 이 자리에 렌더링됩니다. */}
      {children}
      
      {/* 6. <ReactQueryDevtools initialIsOpen={false} />
          개발 환경에서만 보이는 React Query 디버깅 도구입니다.
          화면 우측 하단에 아이콘이 생기며, 모든 쿼리의 상태, 데이터, 캐시 정보 등을 시각적으로 확인할 수 있어 매우 유용합니다. */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}