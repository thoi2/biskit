// /my-page/page.tsx
'use client';

// 1. 사용자 정보 전담 관리자(useUserQuery)를 불러옵니다.
import { useUserQuery } from '@/hooks/useUserQuery';

export default function MyPage() {
    // 2. 관리자에게 현재 사용자 정보와 상태를 물어봅니다.
    // useUserQuery() 훅이 반환하는 객체에서 data와 isLoading 값을 꺼내옵니다.
    // 'data: user'는 data라는 이름의 변수를 user라는 새로운 이름으로 사용하겠다는 의미입니다.
    const { data: user, isLoading } = useUserQuery();
  
    // 3. 조건부 렌더링: 상태에 따라 다른 UI를 보여줍니다.
  
    // 3-1. 로딩 상태일 때 (데이터를 가져오는 중일 때)
    // isLoading이 true이면, 로딩 메시지를 보여주고 아래 코드는 실행하지 않습니다.
    if (isLoading) return <div>프로필 정보를 불러오는 중...</div>;
    
    // 3-2. 데이터가 없는 상태일 때 (로그아웃 상태이거나, 아직 데이터가 없을 때)
    // isLoading이 false인데 user 데이터가 없다면(null 또는 undefined),
    // 아무것도 그리지 않고(null) 컴포넌트를 종료합니다.
    if (!user) return null; 
  
    // 3-3. 성공 상태일 때 (로딩이 끝났고, user 데이터가 있을 때)
    // 위 두 조건에 해당하지 않으면, 가져온 user 데이터를 사용해 프로필 정보를 화면에 그립니다.
    return (
      <div style={{ marginTop: '20px', border: '1px solid black', padding: '10px' }}>
        <h3>사용자 프로필</h3>
        <p>닉네임: {user.nickname}</p>
        <p>이메일: {user.email}</p>
      </div>
    
  );
}
