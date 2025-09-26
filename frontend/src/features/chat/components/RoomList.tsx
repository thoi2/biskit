'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { RoomCard } from './RoomCard';
import { chatApi } from '../api/chatApi';
import { Room } from '../types/chat';
import { Button } from '@/lib/components/ui/button';
import { BIG_CATEGORIES } from '@/constants/categories';
import { RefreshCw, Plus, Users, Globe } from 'lucide-react';

interface RoomListProps {
  onJoinRoom: (roomId: string) => void;
  onCreateRoom?: () => void;
}

export function RoomList({ onJoinRoom, onCreateRoom }: RoomListProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [userRooms, setUserRooms] = useState<{ data: { body: Room[] } }>({
    data: { body: [] },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // 탭 상태 (전체 방 vs 내 방)
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');

  // 카테고리 필터
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // 무한스크롤을 위한 ref
  const observerRef = useRef<HTMLDivElement>(null);

  const loadRooms = async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        setError(null);
      }

      const cursor = isLoadMore ? nextCursor : null;

      const [publicRoomsResponse, myRoomsResponse] = await Promise.all([
        chatApi.getPublicRooms(
          selectedCategory || undefined,
          20,
          cursor || undefined,
        ),
        isLoadMore ? Promise.resolve(userRooms) : chatApi.getUserRooms(), // 더보기일 때는 기존 userRooms 사용
      ]);

      console.log('=== RoomList Debug ===');
      console.log('publicRoomsResponse:', publicRoomsResponse);
      console.log('myRoomsResponse:', myRoomsResponse);

      // API 응답 데이터 처리 - 올바른 데이터 구조 처리
      const publicRoomsData = publicRoomsResponse.data || {
        rooms: [],
        nextCursor: null,
        hasMore: false,
      };
      const myRooms = isLoadMore ? userRooms : myRoomsResponse || [];

      console.log('publicRoomsData:', publicRoomsData);
      console.log('myRooms:', myRooms);
      console.log('publicRoomsData.rooms:', publicRoomsData.body.rooms);

      if (isLoadMore) {
        // 무한스크롤: 기존 목록에 추가
        setRooms(prev => [...prev, ...publicRoomsData.body.rooms]);
      } else {
        // 첫 로드: 새로운 목록으로 교체
        setRooms(publicRoomsData.body.rooms);
        setUserRooms(myRooms);
      }

      setNextCursor(publicRoomsData.body.nextCursor || null);
      setHasMore(publicRoomsData.body.hasMore);
    } catch (err) {
      console.error('방 목록 로드 실패:', err);
      setError('방 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setRooms([]); // 기존 방 목록 초기화
    setNextCursor(null); // 커서 초기화
    setHasMore(false);
    loadRooms(false); // 첫 페이지부터 다시 로드
  };

  const loadMoreRooms = () => {
    if (hasMore && !isLoadingMore) {
      loadRooms(true);
    }
  };

  useEffect(() => {
    loadRooms(false);
  }, []); // selectedCategory 의존성 제거, handleCategoryChange에서 직접 처리

  // 무한스크롤 Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !isLoadingMore &&
          activeTab === 'all'
        ) {
          loadMoreRooms();
        }
      },
      { threshold: 0.1 },
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, activeTab]);

  const isUserInRoom = (roomId: string) => {
    return (userRooms.data.body || []).some(room => room.roomId === roomId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => loadRooms(false)} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          다시 시도
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 탭과 카테고리 필터 */}
      <div className="space-y-3">
        {/* 탭과 액션 버튼 */}
        <div className="flex gap-2">
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg flex-1">
            <Button
              variant={activeTab === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('all')}
              className="flex-1"
            >
              <Globe className="w-4 h-4 mr-2" />
              전체 방
            </Button>
            <Button
              variant={activeTab === 'my' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('my')}
              className="flex-1"
            >
              <Users className="w-4 h-4 mr-2" />내 방
            </Button>
          </div>
          <Button onClick={() => loadRooms(false)} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4" />
          </Button>
          {onCreateRoom && (
            <Button onClick={onCreateRoom} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* 카테고리 필터 (전체 방일 때만) */}
        {activeTab === 'all' && (
          <div>
            <select
              value={selectedCategory}
              onChange={e => handleCategoryChange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">모든 카테고리</option>
              {BIG_CATEGORIES.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 방 목록 */}
      <div>
        {/* 전체 방 탭 */}
        {activeTab === 'all' && (
          <>
            {(rooms || []).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>
                  {selectedCategory
                    ? `${selectedCategory} 카테고리에 표시할 채팅방이 없습니다.`
                    : '표시할 채팅방이 없습니다.'}
                </p>
                {onCreateRoom && (
                  <Button onClick={onCreateRoom} className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />첫 번째 방을 만들어보세요
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {(rooms || []).map(room => (
                    <RoomCard
                      key={room.roomId}
                      room={room}
                      onJoinRoom={onJoinRoom}
                      isJoined={isUserInRoom(room.roomId)}
                    />
                  ))}
                </div>

                {/* 무한스크롤 로딩 인디케이터 */}
                <div
                  ref={observerRef}
                  className="h-10 flex items-center justify-center"
                >
                  {isLoadingMore && (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {/* 내 방 탭 */}
        {activeTab === 'my' && (
          <>
            {(userRooms.data.body || []).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>참여 중인 채팅방이 없습니다.</p>
                <p className="text-sm mt-1">채팅방에 참여해보세요!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {Array.isArray(userRooms.data)
                  ? userRooms.data.map(room => (
                      <RoomCard
                        key={room.roomId}
                        room={room}
                        onJoinRoom={onJoinRoom}
                        isJoined={true}
                      />
                    ))
                  : []}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
