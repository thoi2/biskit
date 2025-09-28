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
  isPanel?: boolean; // 패널 모드 추가
}

type ModalView = 'roomList' | 'chatRoom' | 'createRoom';

export function ChatMainModal({ isOpen, onClose, isPanel = false }: ChatMainModalProps) {
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
      console.log('🏠 채팅방 입장 시작:', roomId);

      // 1. 먼저 채팅방으로 이동 (웹소켓 연결이 먼저 되도록)
      setSelectedRoomId(roomId);
      setCurrentView('chatRoom');

      // 2. 방 정보 조회 (백엔드에서 입장 로직 제거 후 안전)
      try {
        console.log('🏠 방 정보 로드 시도:', roomId);
        const response = await chatApi.getRoomInfo(roomId);
        const room = response.data.body;
        console.log('🏠 방 정보 로드 완료:', room);
        setRoomInfo(room);
      } catch (error) {
        console.warn('방 정보 로드 실패, fallback 사용:', error);
        setRoomInfo({
          roomId,
          roomName: `방 ${roomId.slice(-8)}`,
          creatorId: '',
          creatorUsername: '',
          maxParticipants: 0,
          currentParticipants: 0,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('채팅방 입장 실패:', error);
      // 에러 발생 시에도 일단 입장 시도
      setSelectedRoomId(roomId);
      setCurrentView('chatRoom');
      setRoomInfo({
        roomId,
        roomName: `방 ${roomId.slice(-8)}`,
        creatorId: '',
        creatorUsername: '',
        maxParticipants: 0,
        currentParticipants: 0,
        createdAt: new Date().toISOString(),
      });
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

  // 패널 모드일 때는 wrapper 없이 직접 렌더링
  if (isPanel) {
    return (
        <div className="h-full flex flex-col bg-white">
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
    );
  }

  // 모달 모드 (기존)
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
