// 📁 src/components/ui/Button.tsx

import type { ReactNode } from 'react';

// 1. 컴포넌트 파일 내부에 props 타입을 직접 정의하는 것이 더 명확합니다.
interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger'; // danger variant 추가
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export default function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  type = 'button',
}: ButtonProps) {
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

  // 비활성화 상태 스타일
  const disabledStyle = 'disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      // 2. 정의해둔 스타일 변수들을 조합해서 className에 적용합니다.
      className={`${baseStyle} ${variantStyles[variant]} ${disabledStyle}`}
    >
      {children}
    </button>
  );
}