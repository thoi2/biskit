'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/lib/components/ui/card';
import { Button } from '@/lib/components/ui/button';
import { Badge } from '@/lib/components/ui/badge';
import { ScrollArea } from '@/lib/components/ui/scroll-area';
import { MapPin } from 'lucide-react';
import { Store } from '@/lib/types/store'; // ← 타입 import

interface StoreListProps {
    stores?: Store[]; // optional로 변경
    onStoreSelect: (store: Store) => void;
}

export function StoreList({
                              stores = [], // 기본값 설정
                              onStoreSelect,
                          }: StoreListProps) {
  return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              검색 결과
            </div>
            <Badge variant="outline">{stores.length}개</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {stores.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>검색 결과가 없습니다.</p>
                    <p className="text-sm">다른 업종을 선택해보세요.</p>
                  </div>
              ) : (
                  stores.map(store => (
                      <Card
                          key={store.id}
                          className={`cursor-pointer hover:shadow-md transition-all ${
                              store.hidden ? 'opacity-50' : ''
                          }`}
                          onClick={() => onStoreSelect(store)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="font-medium text-sm mb-1">
                                {store.displayName || `${store.storeName} ${store.branchName}`.trim()}
                              </h3>
                              <p className="text-xs text-muted-foreground mb-1">
                                {store.categoryName || store.bizCategoryCode}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {store.roadAddress}
                              </p>
                            </div>
                          </div>

                          {/* 기본 상가 정보만 표시 */}
                          <div className="mt-2">
                            <p className="text-xs text-gray-500">
                              위치: {store.lat.toFixed(6)}, {store.lng.toFixed(6)}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                  ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
  );
}
