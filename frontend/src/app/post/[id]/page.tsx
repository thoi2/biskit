// src/app/post/[id]/page.tsx

import React from 'react';
import Link from 'next/link';

// 페이지 컴포넌트는 params라는 객체를 prop으로 받을 수 있습니다.
// 이 params 안에는 동적 경로의 값(여기서는 'id')이 들어있습니다.
export default function PostDetailPage({ params }: { params: { id: string } }) {
  const { id } = params; // params 객체에서 id 값을 추출합니다.

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">게시글 상세 페이지</h1>
      <p className="mt-4 text-2xl font-semibold text-blue-600">
        게시글 ID: {id}
      </p>

      <Link href="/" className="mt-8 text-lg text-gray-600 hover:underline">
        홈으로 돌아가기
      </Link>
    </main>
  );
}
