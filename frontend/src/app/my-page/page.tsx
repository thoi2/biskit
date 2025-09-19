'use client';

// 1. 앱의 전역 인증 관리자인 useAuth 훅을 불러옵니다.
import { useAuth } from '@/features/auth/hooks/useAuth';

export default function MyPage() {
  // 2. useAuth 훅을 호출하여 현재 사용자 정보와 로딩 상태를 한번에 가져옵니다.
  const { user, loading } = useAuth();

  // 3. 조건부 렌더링: 상태에 따라 다른 UI를 보여줍니다.

  // 3-1. 로딩 상태일 때
  if (loading) return <div>프로필 정보를 불러오는 중...</div>;

  // 3-2. 데이터가 없는 상태일 때 (로그아웃 상태)
  if (!user) {
    // 로그인되지 않은 사용자를 위한 UI를 보여주거나, 로그인 페이지로 리다이렉트 할 수 있습니다.
    return <div>로그인이 필요한 페이지입니다.</div>;
  }

  // 3-3. 성공 상태일 때 (user 데이터가 있을 때)
  return (
    <div
      style={{ marginTop: '20px', border: '1px solid black', padding: '10px' }}
    >
      <h3>사용자 프로필</h3>
      <p>ID: {user.userId}</p>
      <p>닉네임: {user.name}</p>
      <p>이메일: {user.email}</p>
    </div>
  );
}
