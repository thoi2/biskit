'use client';

import { useState, useEffect } from 'react';
import { X, Plus, ArrowLeft } from 'lucide-react';
import { Button } from '@/lib/components/ui/button';
import { RoomList } from './RoomList';
import { ChatRoom } from './ChatRoom';
import { CreateRoomForm } from './CreateRoomForm';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface ChatMainModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModalView = 'roomList' | 'chatRoom' | 'createRoom';

export function ChatMainModal({
  isOpen,
  onClose
}: ChatMainModalProps) {
  const [currentView, setCurrentView] = useState<ModalView>('roomList');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const { user } = useAuth();

  // useAuth에서 사용자 정보 가져오기
  const currentUserId = user?.userId;
  const currentUsername = user?.username;

  console.log('=== ChatMainModal useAuth ===');
  console.log('user:', user);
  console.log('currentUserId:', currentUserId);
  console.log('currentUsername:', currentUsername);

  const handleJoinRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
    setCurrentView('chatRoom');
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
  };

  const handleLeaveRoom = () => {
    setCurrentView('roomList');
    setSelectedRoomId('');
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
              <Button
                onClick={handleCreateRoom}
                variant="outline"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                방 만들기
              </Button>
            )}
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="p-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 overflow-hidden">
          {currentView === 'roomList' && (
            <div className="h-full overflow-y-auto p-2">
              <RoomList
                onJoinRoom={handleJoinRoom}
                onCreateRoom={handleCreateRoom}
              />
            </div>
          )}

          {currentView === 'chatRoom' && selectedRoomId && (
            <ChatRoom
              roomId={selectedRoomId}
              onLeaveRoom={handleLeaveRoom}
              onBackClick={handleBackToList}
            />
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