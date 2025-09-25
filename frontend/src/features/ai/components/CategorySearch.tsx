// features/ai/components/CategorySearch.tsx

'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Badge } from '@/lib/components/ui/badge';
import { Search, X } from 'lucide-react';
import storeCategories from '@/lib/data/store_categories.json';
import { Label } from '@/lib/components/ui/label';

// 1. 데이터 준비: 중복을 제거한 소분류 카테고리 목록을 미리 만들어 둡니다.
const allSubCategories = [
  ...new Set(storeCategories.map(item => item.상권업종소분류명)),
].sort();

// 2. 컴포넌트 Props 타입 정의
interface CategorySearchProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  disabled?: boolean;
}

export function CategorySearch({
  selectedCategory,
  onSelectCategory,
  disabled = false,
}: CategorySearchProps) {
  // 3. 상태 관리: 메뉴 열림 여부, 검색어
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // 4. 외부 클릭 감지 로직
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    // 이벤트 리스너 등록
    document.addEventListener('mousedown', handleClickOutside);
    // 클린업 함수: 컴포넌트가 사라질 때 리스너 제거
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [searchContainerRef]);

  // 5. 검색어에 따라 카테고리 필터링 (최적화)
  const filteredCategories = useMemo(() => {
    if (!searchTerm) {
      return allSubCategories;
    }
    return allSubCategories.filter(category =>
      category.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [searchTerm]);

  const handleSelect = (category: string) => {
    onSelectCategory(category);
    setSearchTerm('');
    setIsOpen(false);
  };

  return (
    <div className="w-full space-y-1">
      <Label htmlFor="business-type" className="text-xs">
        업종 (선택사항)
      </Label>
      <div ref={searchContainerRef} className="relative">
        {selectedCategory ? (
          // 카테고리가 선택되었을 때의 UI
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-base py-1 px-3">
              {selectedCategory}
            </Badge>
            <button
              type="button"
              onClick={() => onSelectCategory('')}
              disabled={disabled}
              className="p-1 rounded-full hover:bg-gray-200 disabled:opacity-50"
              aria-label="선택 해제"
            >
              <X className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        ) : (
          // 카테고리 검색 UI
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder="업종명 검색..."
              disabled={disabled}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-50"
            />
          </div>
        )}

        {/* 검색 결과 드롭다운 */}
        {isOpen && !selectedCategory && (
          <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-10">
            <ul className="max-h-60 overflow-y-auto">
              {filteredCategories.length > 0 ? (
                filteredCategories.map(category => (
                  <li
                    key={category}
                    onClick={() => handleSelect(category)}
                    className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                  >
                    {category}
                  </li>
                ))
              ) : (
                <li className="px-4 py-2 text-sm text-gray-500">
                  검색 결과가 없습니다.
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
