// src/app/about/page.tsx

import React from 'react';

// Next.js에서는 export default function이 페이지 컴포넌트가 됩니다.
export default function AboutPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">소개 페이지입니다.</h1>
      <p className="mt-4 text-lg">
        이 페이지는 `app/about/page.tsx` 파일에 의해 생성되었습니다.
      </p>
    </main>
  );
}
