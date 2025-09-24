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
}

export function ChatRoom({
  roomId,
  onLeaveRoom,
  onBackClick
}: ChatRoomProps) {
  const [roomInfo, setRoomInfo] = useState<Room | null>(null);
  const [isLoadingRoom, setIsLoadingRoom] = useState(true);
  const { user } = useAuth();

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
    loadMoreMessages
  } = useChatRoom({
    roomId,
    currentUserId,
    currentUsername
  });

  // 방 정보 로드
  useEffect(() => {
    const loadRoomInfo = async () => {
      try {
        setIsLoadingRoom(true);
        const room = await chatApi.getRoomInfo(roomId);
        setRoomInfo(room);
      } catch (error) {
        console.error('방 정보 로드 실패:', error);
      } finally {
        setIsLoadingRoom(false);
      }
    };

    if (roomId) {
      loadRoomInfo();
    }
  }, [roomId]);

  const handleLeaveRoom = async () => {
    try {
      await chatApi.leaveRoom(roomId);
      onLeaveRoom?.();
    } catch (error) {
      console.error('방 나가기 실패:', error);
    }
  };

  if (isLoadingRoom) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!roomInfo) {
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
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center gap-3">
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
            <h2 className="font-semibold text-lg">{roomInfo.roomName}</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="w-3 h-3" />
              <span>{roomInfo.currentParticipants}/{roomInfo.maxParticipants}</span>
              {!isConnected && (
                <span className="text-red-500">
                  {isConnecting ? '연결 중...' : '연결 끊김'}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleLeaveRoom}
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-700"
          >
            나가기
          </Button>
        </div>
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
          isConnected
            ? '메시지를 입력하세요...'
            : '연결을 기다리는 중...'
        }
      />
    </div>
  );
}