'use client';

import { Room } from '../types/chat';
import { Card } from '@/lib/components/ui/card';
import { Button } from '@/lib/components/ui/button';
import { Users } from 'lucide-react';

interface RoomCardProps {
  room: Room;
  onJoinRoom: (roomId: string) => void;
  isJoined?: boolean;
}

export function RoomCard({ room, onJoinRoom, isJoined = false }: RoomCardProps) {
  const isRoomFull = room.currentParticipants >= room.maxParticipants;

  return (
    <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-center justify-between">
        {/* 왼쪽: 방 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-sm truncate">{room.roomName}</h3>
            {room.bigCategory && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full whitespace-nowrap">
                {room.bigCategory}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Users className="w-3 h-3" />
            <span>
              {room.currentParticipants}/{room.maxParticipants}명
              {isRoomFull && (
                <span className="ml-1 text-red-500 font-medium">(만실)</span>
              )}
            </span>
          </div>
        </div>

        {/* 오른쪽: 입장 버튼 */}
        <div className="ml-3 flex-shrink-0">
          <Button
            onClick={() => onJoinRoom(room.roomId)}
            disabled={isRoomFull && !isJoined}
            size="sm"
            variant={isJoined ? 'outline' : 'default'}
          >
            {isJoined ? '입장' : isRoomFull ? '만실' : '입장'}
          </Button>
        </div>
      </div>
    </Card>
  );
}