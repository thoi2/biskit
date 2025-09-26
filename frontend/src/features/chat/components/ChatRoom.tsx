'use client';

import { useEffect, useState } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { useChatRoom } from '../hooks/useChatRoom';
import { chatApi } from '../api/chatApi';
import { Room } from '../types/chat';
import { Button } from '@/lib/components/ui/button';
import { ArrowLeft, Users, Settings } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface ChatRoomProps {
  roomId: string;
  onLeaveRoom?: () => void;
  onBackClick?: () => void;
  preloadedRoomInfo?: Room | null;
}

export function ChatRoom({
  roomId,
  onLeaveRoom,
  onBackClick,
  preloadedRoomInfo,
}: ChatRoomProps) {
  console.log('🔍 ChatRoom 컴포넌트 시작');
  console.log('🔍 roomId:', roomId);
  console.log('🔍 preloadedRoomInfo:', preloadedRoomInfo);
  console.log('🔍 preloadedRoomInfo type:', typeof preloadedRoomInfo);
  console.log('🔍 preloadedRoomInfo null check:', preloadedRoomInfo === null);
  console.log('🔍 preloadedRoomInfo undefined check:', preloadedRoomInfo === undefined);

  const [roomInfo, setRoomInfo] = useState<Room | null>(
    preloadedRoomInfo || null,
  );
  const [isLoadingRoom, setIsLoadingRoom] = useState(!preloadedRoomInfo);
  const { user } = useAuth();

  console.log('🔍 초기 roomInfo 상태:', roomInfo);
  console.log('🔍 초기 isLoadingRoom 상태:', isLoadingRoom);

  // useAuth에서 사용자 정보 가져오기
  const currentUserId = user?.userId;
  const currentUsername = user?.username;

  console.log('=== ChatRoom useAuth ===');
  console.log('user:', user);
  console.log('currentUserId:', currentUserId);
  console.log('currentUsername:', currentUsername);

  const {
    messages,
    isLoadingMessages,
    hasMoreMessages,
    isConnected,
    isConnecting,
    sendMessage,
    loadMoreMessages,
  } = useChatRoom({
    roomId,
    currentUserId,
    currentUsername,
  });

  console.log('🏠 ChatRoom - 상태:', {
    messagesCount: messages?.length || 0,
    roomId,
    isConnected,
    isConnecting,
    roomInfo: roomInfo,
    isLoadingRoom,
  });

  // 방 정보 로드 (preloaded가 없을 때만)
  useEffect(() => {
    console.log('🔍 useEffect 실행 - 방 정보 로드');
    console.log('🔍 roomId:', roomId);
    console.log('🔍 preloadedRoomInfo 체크:', preloadedRoomInfo);
    console.log('🔍 조건 체크 - roomId && !preloadedRoomInfo:', roomId && !preloadedRoomInfo);

    const loadRoomInfo = async () => {
      try {
        setIsLoadingRoom(true);
        console.log('🔍 API 호출 시작 - 방 정보 로드:', roomId);
        const response = await chatApi.getRoomInfo(roomId);
        console.log('🔍 API 응답 원본:', response);
        const room = response.data.body; // 실제 room 데이터는 body에 있음
        console.log('🔍 추출된 방 정보:', room);
        console.log('🔍 방 정보 타입:', typeof room);
        setRoomInfo(room);
        console.log('🔍 setRoomInfo 호출 완료');
      } catch (error) {
        console.error('🔍 방 정보 로드 실패:', error);
        const fallbackRoom = {
          roomId,
          roomName: `방 ${roomId.slice(-8)}`,
          creatorId: '',
          creatorUsername: '',
          maxParticipants: 0,
          currentParticipants: 0,
          createdAt: new Date().toISOString(),
        };
        console.log('🔍 fallback 룸 정보 설정:', fallbackRoom);
        setRoomInfo(fallbackRoom);
      } finally {
        setIsLoadingRoom(false);
        console.log('🔍 로딩 상태 false로 변경');
      }
    };

    // preloadedRoomInfo가 없을 때만 API 호출
    if (roomId && !preloadedRoomInfo) {
      console.log('🔍 조건 만족 - API 호출 실행');
      loadRoomInfo();
    } else {
      console.log('🔍 조건 불만족 - API 호출 스킵');
    }
  }, [roomId, preloadedRoomInfo]);

  const handleLeaveRoom = async () => {
    try {
      await chatApi.leaveRoom(roomId);
      onLeaveRoom?.();
    } catch (error) {
      console.error('방 나가기 실패:', error);
    }
  };

  console.log('🔍 렌더링 직전 상태 체크:');
  console.log('🔍 isLoadingRoom:', isLoadingRoom);
  console.log('🔍 roomInfo:', roomInfo);
  console.log('🔍 roomInfo null 체크:', roomInfo === null);
  console.log('🔍 roomInfo undefined 체크:', roomInfo === undefined);
  console.log('🔍 !roomInfo 체크:', !roomInfo);

  if (isLoadingRoom) {
    console.log('🔍 로딩 중 화면 렌더링');
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!roomInfo) {
    console.log('🔍 roomInfo 없음 - 에러 화면 렌더링');
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">채팅방을 찾을 수 없습니다.</p>
          <Button onClick={onBackClick} variant="outline">
            돌아가기
          </Button>
        </div>
      </div>
    );
  }

  console.log('🔍 정상 렌더링 - roomInfo 존재:', roomInfo);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          {onBackClick && (
            <Button
              onClick={onBackClick}
              variant="ghost"
              size="sm"
              className="p-1"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <div>
            <h2 className="font-medium text-sm">
              {roomInfo?.roomName || `방 ${roomId.slice(-8)}`}
            </h2>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              {roomInfo?.bigCategory && (
                <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-xs">
                  {roomInfo.bigCategory}
                </span>
              )}
              <Users className="w-3 h-3" />
              <span>
                {roomInfo
                  ? `${roomInfo.currentParticipants}/${roomInfo.maxParticipants}`
                  : '-'}
              </span>
              {!isConnected && (
                <span className="text-red-500 text-xs">
                  {isConnecting ? '연결중' : '끊김'}
                </span>
              )}
            </div>
          </div>
        </div>

        <Button
          onClick={handleLeaveRoom}
          variant="ghost"
          size="sm"
          className="text-red-500 hover:text-red-700 text-xs px-2"
        >
          나가기
        </Button>
      </div>

      {/* 메시지 영역 */}
      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        isLoadingMessages={isLoadingMessages}
        hasMoreMessages={hasMoreMessages}
        onLoadMore={loadMoreMessages}
      />

      {/* 메시지 입력 */}
      <MessageInput
        onSendMessage={sendMessage}
        disabled={!isConnected}
        placeholder={
          isConnected ? '메시지를 입력하세요...' : '연결을 기다리는 중...'
        }
      />
    </div>
  );
}
