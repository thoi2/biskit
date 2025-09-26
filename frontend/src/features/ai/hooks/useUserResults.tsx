// src/features/ai/hooks/useUserResults.tsx
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getUserResults } from '@/features/ai/api';

export const useUserResults = () => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['userResults', user?.id],
        queryFn: () => getUserResults(),
        enabled: !!user, // 로그인 상태에서만 실행
        staleTime: 1000 * 60 * 5, // 5분 캐시
        refetchOnWindowFocus: false,
    });
};
