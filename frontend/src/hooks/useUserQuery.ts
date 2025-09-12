// /hooks/useUserQuery.ts
import { useQuery } from '@tanstack/react-query';
import { checkAuthStatusAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export const useUserQuery = () => {
  // 1. "문지기"를 불러옵니다.
  // Zustand 스토어에서 'isLoggedIn'이라는 현재 로그인 상태를 가져옵니다.
  // 이 값이 API 요청을 해도 되는지 허락해주는 '출입증' 역할을 합니다.
  const { isLoggedIn } = useAuthStore();

  // 2. React Query의 핵심, useQuery를 사용하여 데이터 관리자를 설정합니다.
  return useQuery({
    
    // 3. 데이터의 '이름표(ID)'를 붙여줍니다.
    // queryKey는 React Query 캐시에서 이 데이터를 식별하는 고유한 이름입니다.
    // ['user', 'profile']이라는 이름표가 붙은 데이터를 나중에 찾거나 업데이트할 수 있습니다.
    queryKey: ['user', 'profile'],
    
    // 4. '실행할 임무'를 지정합니다.
    // queryFn은 실제로 데이터를 가져오는 비동기 함수를 지정합니다.
    // 여기서는 checkAuthStatusAPI 함수가 그 임무를 수행합니다.
    queryFn: checkAuthStatusAPI,
    
    // 5. '임무 실행 조건'을 설정합니다. (가장 중요!)
    // enabled 옵션은 이 쿼리가 자동으로 실행될지 여부를 결정합니다.
    // isLoggedIn이 true일 때만 API 요청이 나가도록 하여,
    // 비로그인 상태에서의 불필요한 API 호출을 원천적으로 차단합니다.
    enabled: isLoggedIn,
    
    // 6. 데이터의 '신선도 유지 기간'을 설정합니다.
    // staleTime: Infinity는 한번 가져온 데이터는 '절대 상하지 않는다(stale)'고 설정하는 것입니다.
    // 즉, 사용자가 직접 로그아웃하거나 캐시를 무효화(invalidate)하기 전까지는,
    // 창을 다시 포커스해도 불필요한 API 재요청을 하지 않아 성능상 이점을 가집니다.
    staleTime: Infinity,
  });
};