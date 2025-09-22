// components/StoreItem.tsx

import { Button } from '@/lib/components/ui/button';
import { Badge } from '@/lib/components/ui/badge';
import { Eye, EyeOff, Trash2 } from 'lucide-react';
import { Store } from '@/features/stores/types/store';

interface StoreItemProps {
    store: Store;
    isHighlighted: boolean;
    onToggleHide: (id: number) => void;
    onDelete: (id: number) => void;
    onClick: (id: number) => void;
}

export function StoreItem({
                              store,
                              isHighlighted,
                              onToggleHide,
                              onDelete,
                              onClick,
                          }: StoreItemProps) {
    return (
        <div
            data-store-id={store.id}
            className={`p-2 border rounded hover:bg-gray-50 transition-all cursor-pointer ${
                isHighlighted
                    ? 'ring-2 ring-blue-500 bg-blue-50 transform scale-105'
                    : ''
            } ${
                store.hidden ? 'opacity-50 bg-gray-50' : ''
            }`}
            onClick={() => onClick(store.id)}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Badge className={`text-white text-xs h-5 ${
                        store.hidden ? 'bg-gray-400' : 'bg-blue-500'
                    }`}>
                        상가 {store.hidden ? '(숨김)' : ''}
                    </Badge>
                    <span className={`font-medium text-sm ${
                        store.hidden ? 'text-gray-500' : 'text-gray-900'
                    }`}>
            {store.displayName || `${store.storeName} ${store.branchName || ''}`.trim()}
          </span>
                </div>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    {/* 눈 모양 버튼 - 숨기기/보이기만 */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleHide(store.id)}
                        className={`h-6 w-6 p-0 transition-colors ${
                            store.hidden
                                ? 'text-gray-400 hover:text-blue-500'
                                : 'text-blue-500 hover:text-gray-400'
                        }`}
                        title={store.hidden ? "지도에 표시" : "지도에서 숨기기"}
                    >
                        {store.hidden ? (
                            <EyeOff className="w-3 h-3" />
                        ) : (
                            <Eye className="w-3 h-3" />
                        )}
                    </Button>

                    {/* X 버튼 - 완전 삭제 */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            if (window.confirm('이 상가를 목록에서 완전히 삭제하시겠습니까?')) {
                                onDelete(store.id);
                            }
                        }}
                        className="text-red-500 hover:text-red-700 h-6 w-6 p-0 transition-colors"
                        title="목록에서 완전 삭제"
                    >
                        <Trash2 className="w-3 h-3" />
                    </Button>
                </div>
            </div>
            <p className={`text-xs mt-1 ${
                store.hidden ? 'text-gray-400' : 'text-gray-600'
            }`}>
                {store.roadAddress}
            </p>
            <p className={`text-xs ${
                store.hidden ? 'text-gray-400' : 'text-gray-500'
            }`}>
                {store.categoryName || store.bizCategoryCode}
            </p>
        </div>
    );
}
