// types/store.ts
export interface Store {
  id: number;
  storeName: string;
  branchName: string;
  bizCategoryCode: string;
  dongCode: number;
  roadAddress: string;
  lat: number;
  lng: number;
  hidden?: boolean;
  // 표시용 필드 (계산된 값)
  displayName?: string;    // storeName + branchName
  categoryName?: string;   // bizCategoryCode → 한글 변환

}
