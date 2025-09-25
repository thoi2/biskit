// 📁 src/components/ui/Button/LinkButton.tsx

import Link from 'next/link';
import type { ReactNode } from 'react';
// 1. Button.tsx와 동일한 스타일 파일을 불러옵니다.

interface LinkButtonProps {
  children: ReactNode;
  href: string; // 2. onClick 대신 이동할 경로(href)를 받습니다.
  variant?: 'primary' | 'secondary' | 'danger';
}

export default function LinkButton({
  children,
  href,
  variant = 'primary',
}: LinkButtonProps) {
    // 👇 모든 버튼이 공유할 새로운 기본 스타일로 업데이트합니다.
  const baseStyle =
    'inline-block text-center text-sm font-medium px-3 py-1.5 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';

  // 👇 variant는 이제 '색상'과 관련된 스타일에만 집중합니다.
  const variantStyles = {
    primary: 
      'bg-white text-indigo-600 hover:bg-indigo-50 active:bg-indigo-100 focus:ring-indigo-500', // focus:ring-white/20 보다 구체적인 색상이 좋습니다.
    secondary: 
      'text-white hover:bg-purple-700/20 active:bg-purple-800/30 focus:ring-white/20',
      // 'bg-white text-indigo-600 hover:bg-gray-300 focus:ring-gray-400',
    danger: 
      'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };
  
  return (
    // 3. <button> 대신 <Link> 컴포넌트를 사용합니다.
    <Link
      href={href}
      // 4. Button.tsx와 완전히 동일한 방식으로 className을 조합합니다.
      className={`${baseStyle} ${variantStyles[variant]}`}
    >
      {children}
    </Link>
  );
}