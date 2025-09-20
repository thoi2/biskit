'use client';

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/lib/components/ui/card';
import { Button } from '@/lib/components/ui/button';
import { Badge } from '@/lib/components/ui/badge';
import { Heart, FileText, Eye, EyeOff, Trash2 } from 'lucide-react';
import { FavoritesList } from '@/lib/components/favorites-list';
import { Store } from '@/lib/types/store';
import { RecommendationResult } from '@/lib/types/recommendation';

interface ResultPanelProps {
    user: Record<string, any> | null;
    stores?: Store[]; // ← optional로 변경
    recommendationResults?: RecommendationResult[]; // ← optional로 변경
    onToggleHideStore: (id: number) => void;
    onToggleRecommendationFavorite: (id: string) => void;
    onToggleHideRecommendation: (id: string) => void;
    onDeleteRecommendation: (id: string) => void;
}

export function ResultPanel({
                                user,
                                stores = [], // ← 기본값 설정
                                recommendationResults = [], // ← 기본값 설정
                                onToggleHideStore,
                                onToggleRecommendationFavorite,
                                onToggleHideRecommendation,
                                onDeleteRecommendation,
                            }: ResultPanelProps) {
    return (
        <div className="space-y-6">
            {/* 로그인한 경우만 찜 목록 표시 */}
            {user && (
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b border-orange-200 pb-2 flex items-center gap-2">
                        <Heart className="w-5 h-5 text-red-500" />
                        내 찜 목록
                    </h3>
                    <FavoritesList />
                </div>
            )}

            {/* 현재 세션 결과 */}
            <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b border-orange-200 pb-2">
                    현재 세션 결과
                </h3>

                {/* 상가 결과 - 이제 안전함 */}
                {stores.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base text-blue-700 flex items-center justify-between">
                                검색된 상가
                                <Badge variant="outline">{stores.length}개</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {stores.map(store => (
                                <div
                                    key={`store-${store.id}`}
                                    className={`p-3 border rounded-lg transition-opacity ${
                                        store.hidden ? 'opacity-50' : ''
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Badge className="bg-blue-500 text-white text-xs">
                                                상가
                                            </Badge>
                                            <span className="font-medium">
                        {store.displayName || `${store.storeName} ${store.branchName}`.trim()}
                      </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onToggleHideStore(store.id)}
                                                className="text-gray-500 hover:text-gray-700"
                                            >
                                                {store.hidden ? (
                                                    <EyeOff className="w-4 h-4" />
                                                ) : (
                                                    <Eye className="w-4 h-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {store.roadAddress}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {store.categoryName || store.bizCategoryCode}
                                    </p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* 추천 결과 - 이제 안전함 */}
                {recommendationResults.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base text-orange-700 flex items-center justify-between">
                                AI 추천
                                <Badge variant="outline">
                                    {recommendationResults.length}개
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {recommendationResults.map(rec => (
                                <div
                                    key={`rec-${rec.id}`}
                                    className={`p-3 border border-orange-200 rounded-lg bg-orange-50 transition-opacity ${
                                        rec.hidden ? 'opacity-50' : ''
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Badge className="bg-orange-500 text-white text-xs">
                                                추천
                                            </Badge>
                                            <span className="font-medium">{rec.businessName}</span>
                                        </div>
                                        <div className="flex gap-1">
                                            {/* 눈 버튼 */}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onToggleHideRecommendation(rec.id)}
                                                className="text-gray-500 hover:text-gray-700"
                                            >
                                                {rec.hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </Button>

                                            {/* 찜 버튼 - 로그인한 경우만 */}
                                            {user && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => onToggleRecommendationFavorite(rec.id)}
                                                    className="text-yellow-500 hover:text-yellow-600"
                                                >
                                                    {rec.isFavorite ? '★' : '☆'}
                                                </Button>
                                            )}

                                            {/* 삭제 버튼 */}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onDeleteRecommendation(rec.id)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">{rec.address}</p>
                                    <p className="text-xs text-orange-600 mt-1">
                                        폐업률: {rec.closureProbability.year1}%
                                    </p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {stores.length === 0 && recommendationResults.length === 0 && (
                    <Card>
                        <CardContent className="text-center py-8">
                            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                            <p className="text-gray-500 mb-2">아직 검색 결과가 없습니다</p>
                            <p className="text-sm text-gray-400">
                                검색 또는 추천을 실행해보세요
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* 비로그인 시 안내 메시지 */}
            {!user && (
                <Card className="border-orange-200">
                    <CardContent className="p-4 bg-orange-50">
                        <p className="text-sm text-orange-700 text-center">
                            로그인하면 찜 목록을 확인할 수 있습니다
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
