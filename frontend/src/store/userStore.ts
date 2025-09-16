import { create } from 'zustand';
import type { User } from '@/types';

interface UserStore {
    user: User | null;
    isLoggedIn: boolean;
    setUser: (user: User) => void;
    logout: () => void;
    login: () => void; // 로그인 함수 추가
}

export const useUserStore = create<UserStore>((set) => ({
    user: null,
    isLoggedIn: false,

    setUser: (userInfo) => set({ user: userInfo, isLoggedIn: true }),
    logout: () => set({ user: null, isLoggedIn: false }),
    login: () => set({ isLoggedIn: true }), // 간단한 로그인 상태 변경
}));
