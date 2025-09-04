"use client";

import Link from 'next/link'; // 1. next/link에서 Link를 가져옵니다.

export default function Home() {

  return (
    <div>
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">홈페이지</h1>
      {/* 2. a 태그 대신 Link 컴포넌트를 사용하고, href로 이동할 경로를 지정합니다. */}
      <Link
        href="/about"
        className="mt-8 rounded-lg bg-blue-500 px-6 py-3 text-lg font-semibold text-white transition hover:bg-blue-600"
      >
        소개 페이지로 이동하기
      </Link>
    </main>
    </div>
  );
}