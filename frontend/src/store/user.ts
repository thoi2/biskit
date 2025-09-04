import { create } from 'zustand';
import type { User } from '@/types'; // 이전에 정의한 User 타입을 가져옵니다.

// 스토어가 가지게 될 상태와 액션들의 타입을 정의합니다.
interface UserStore {
  user: User | null;
  isLoggedIn: boolean;
  setUser: (user: User) => void;
  logout: () => void;
}

// 스토어를 생성합니다.
export const useUserStore = create<UserStore>((set) => ({
  // 1. 초기 상태 (State)
  user: null,
  isLoggedIn: false,

  // 2. 상태를 변경하는 함수 (Actions)
  setUser: (userInfo) => set({ user: userInfo, isLoggedIn: true }),
  logout: () => set({ user: null, isLoggedIn: false }),
}));