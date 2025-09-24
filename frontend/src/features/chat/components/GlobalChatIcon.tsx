'use client';

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/lib/components/ui/button';
import { ChatMainModal } from './ChatMainModal';

interface GlobalChatIconProps {
  currentUserId?: string;
  currentUsername?: string;
}

export function GlobalChatIcon({
  currentUserId,
  currentUsername
}: GlobalChatIconProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      {/* 고정된 채팅 아이콘 */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsModalOpen(true)}
          className="rounded-full w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      </div>

      {/* 채팅 메인 모달 */}
      <ChatMainModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentUserId={currentUserId}
        currentUsername={currentUsername}
      />
    </>
  );
}