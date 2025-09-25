'use client';

import { useState, useEffect } from 'react';
import { X, Plus, ArrowLeft } from 'lucide-react';
import { Button } from '@/lib/components/ui/button';
import { RoomList } from './RoomList';
import { ChatRoom } from './ChatRoom';
import { CreateRoomForm } from './CreateRoomForm';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { chatApi } from '../api/chatApi';
import { Room } from '../types/chat';

interface ChatMainModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModalView = 'roomList' | 'chatRoom' | 'createRoom';

export function ChatMainModal({ isOpen, onClose }: ChatMainModalProps) {
  const [currentView, setCurrentView] = useState<ModalView>('roomList');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [roomInfo, setRoomInfo] = useState<Room | null>(null);
  const [isLoadingRoom, setIsLoadingRoom] = useState(false);
  const { user } = useAuth();

  // useAuth에서 사용자 정보 가져오기
  const currentUserId = user?.userId;
  const currentUsername = user?.username;

  console.log('=== ChatMainModal useAuth ===');
  console.log('user:', user);
  console.log('currentUserId:', currentUserId);
  console.log('currentUsername:', currentUsername);

  const handleJoinRoom = async (roomId: string) => {
    try {
      setIsLoadingRoom(true);
      console.log('🏠 방 정보 미리 로드:', roomId);

      // 먼저 방 정보 API 호출
      const response = await chatApi.getRoomInfo(roomId);
      const room = response; // Axios 응답에서 data 추출
      console.log('🏠 방 정보 로드 완료:', room);
      console.log('🏠 room.roomName:', room?.roomName);
      console.log('🏠 room.bigCategory:', room?.bigCategory);

      setRoomInfo(room);
      setSelectedRoomId(roomId);
      setCurrentView('chatRoom');
    } catch (error) {
      console.error('방 정보 로드 실패:', error);

      // 방 정보 로드 실패해도 일단 입장은 허용
      setRoomInfo({
        roomId,
        roomName: `방 ${roomId.slice(-8)}`,
        creatorId: '',
        creatorUsername: '',
        maxParticipants: 0,
        currentParticipants: 0,
        createdAt: new Date().toISOString(),
      });
      setSelectedRoomId(roomId);
      setCurrentView('chatRoom');
    } finally {
      setIsLoadingRoom(false);
    }
  };

  const handleCreateRoom = () => {
    setCurrentView('createRoom');
  };

  const handleRoomCreated = (roomId: string) => {
    setSelectedRoomId(roomId);
    setCurrentView('chatRoom');
  };

  const handleBackToList = () => {
    setCurrentView('roomList');
    setSelectedRoomId('');
    setRoomInfo(null);
  };

  const handleLeaveRoom = () => {
    setCurrentView('roomList');
    setSelectedRoomId('');
    setRoomInfo(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-20 right-4 z-50">
      <div className="bg-white rounded-lg w-80 h-[500px] shadow-lg border flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2">
            {currentView !== 'roomList' && (
              <Button
                onClick={handleBackToList}
                variant="ghost"
                size="sm"
                className="p-1"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <h2 className="text-lg font-semibold">
              {currentView === 'roomList' && '채팅방'}
              {currentView === 'chatRoom' && '채팅'}
              {currentView === 'createRoom' && '새 채팅방 만들기'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {currentView === 'roomList' && (
              <Button onClick={handleCreateRoom} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />방 만들기
              </Button>
            )}
            <Button onClick={onClose} variant="ghost" size="sm" className="p-1">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 overflow-hidden">
          {isLoadingRoom && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">방 정보 로드 중...</p>
              </div>
            </div>
          )}

          {!isLoadingRoom && currentView === 'roomList' && (
            <div className="h-full overflow-y-auto p-2">
              <RoomList
                onJoinRoom={handleJoinRoom}
                onCreateRoom={handleCreateRoom}
              />
            </div>
          )}

          {!isLoadingRoom && currentView === 'chatRoom' && selectedRoomId && (
            <>
              {console.log('ChatRoom으로 전달할 roomInfo:', roomInfo)}
              <ChatRoom
                roomId={selectedRoomId}
                onLeaveRoom={handleLeaveRoom}
                onBackClick={handleBackToList}
                preloadedRoomInfo={roomInfo}
              />
            </>
          )}

          {currentView === 'createRoom' && (
            <div className="h-full overflow-y-auto p-2">
              <CreateRoomForm
                onRoomCreated={handleRoomCreated}
                onCancel={handleBackToList}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
