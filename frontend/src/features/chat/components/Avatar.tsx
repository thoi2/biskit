'use client';

import { User } from 'lucide-react';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  // 이름의 첫 글자 추출 (이니셜)
  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  // 배경색을 이름에 따라 일관되게 생성
  const getBackgroundColor = (name: string) => {
    const colors = [
      'bg-red-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-gray-500'
    ];

    const hash = name.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

    return colors[Math.abs(hash) % colors.length];
  };

  if (src) {
    return (
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden ${className}`}>
        <img
          src={src}
          alt={`${name}의 프로필`}
          className="w-full h-full object-cover"
          onError={(e) => {
            // 이미지 로드 실패 시 기본 아바타로 변경
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = `
                <div class="w-full h-full ${getBackgroundColor(name)} flex items-center justify-center text-white font-medium">
                  ${getInitial(name)}
                </div>
              `;
            }
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full ${getBackgroundColor(name)} flex items-center justify-center text-white font-medium ${className}`}
    >
      {name ? getInitial(name) : <User className={iconSizes[size]} />}
    </div>
  );
}