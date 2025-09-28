'use client';

import { useState } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { useChatRoom } from '../hooks/useChatRoom';
import { chatApi } from '../api/chatApi';
import { Room } from '../types/chat';
import { Button } from '@/lib/components/ui/button';
import { ArrowLeft, Users } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useGlobalWebSocket } from '../contexts/WebSocketContext';

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
  const [roomInfo, setRoomInfo] = useState<Room | null>(
    preloadedRoomInfo || null,
  );
  const [isLoadingRoom, setIsLoadingRoom] = useState(false);
  const { user } = useAuth();
  const {
    leaveRoom: wsLeaveRoom,
    connectionStatus: { isConnected },
  } = useGlobalWebSocket();

  // useAuth에서 사용자 정보 가져오기
  const currentUserId = user?.userId;

  const {
    messages,
    isLoadingMessages,
    hasMoreMessages,
    isConnecting,
    sendMessage,
    loadMoreMessages,
  } = useChatRoom({
    roomId,
    currentUserId,
  });

  // 방 정보 로드 제거 - 중복 입장 방지를 위해 WebSocket으로만 처리
  // preloadedRoomInfo는 ChatMainModal에서 항상 제공되므로 추가 API 호출 불필요

  const handleLeaveRoom = async () => {
    try {
      // 1. WebSocket으로 실시간 나가기 알림 (다른 사람들에게 알림)
      if (isConnected) {
        console.log('🚪 WebSocket 나가기 알림 전송:', roomId);
        wsLeaveRoom(roomId);
      }

      // 2. REST API로 DB에서 참여자 제거
      const response = await chatApi.leaveRoom(roomId);
      console.log('방 나가기 성공:', response.data.body);
      onLeaveRoom?.();
    } catch (error) {
      console.error('방 나가기 실패:', error);
      // 에러가 나도 일단 나가기 처리
      onLeaveRoom?.();
    }
  };

  if (isLoadingRoom) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // roomInfo가 없어도 채팅은 가능하도록 처리
  // 단, roomId가 없으면 에러
  if (!roomId) {
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
