/**
 * 상권업종대분류명 상수
 * store_categories.json 파일에서 추출한 10개 대분류
 */
export const BIG_CATEGORIES = [
  '과학·기술',
  '교육',
  '보건의료',
  '부동산',
  '소매',
  '수리·개인',
  '숙박',
  '시설관리·임대',
  '예술·스포츠',
  '음식'
] as const;

/**
 * 대분류명 타입
 */
export type BigCategory = typeof BIG_CATEGORIES[number];

/**
 * 대분류명이 유효한지 확인하는 함수
 */
export const isValidCategory = (category: string): category is BigCategory => {
  return BIG_CATEGORIES.includes(category as BigCategory);
};

/**
 * 대분류명 목록을 배열로 반환하는 함수
 */
export const getCategoryList = (): readonly string[] => {
  return BIG_CATEGORIES;
};