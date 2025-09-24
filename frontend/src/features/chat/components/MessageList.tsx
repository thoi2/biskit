'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageItem } from './MessageItem';
import { ChatMessage } from '../types/chat';
import { Button } from '@/lib/components/ui/button';
import { ChevronUp } from 'lucide-react';

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId?: string;
  isLoadingMessages?: boolean;
  hasMoreMessages?: boolean;
  onLoadMore?: () => void;
}

export function MessageList({
  messages,
  currentUserId,
  isLoadingMessages = false,
  hasMoreMessages = false,
  onLoadMore
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  // 스크롤을 맨 아래로
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 스크롤 위치 감지
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

    setShouldAutoScroll(isNearBottom);
    setShowScrollToBottom(!isNearBottom && messages.length > 0);

    // 맨 위에서 더 많은 메시지 로드
    if (scrollTop === 0 && hasMoreMessages && !isLoadingMessages && onLoadMore) {
      onLoadMore();
    }
  };

  // 새 메시지가 추가될 때 자동 스크롤
  useEffect(() => {
    if (shouldAutoScroll && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, shouldAutoScroll]);

  // 초기 스크롤
  useEffect(() => {
    scrollToBottom();
  }, []);

  if (messages.length === 0 && !isLoadingMessages) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p>아직 메시지가 없습니다.</p>
          <p className="text-sm mt-1">첫 번째 메시지를 보내보세요!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative">
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto p-4 space-y-2"
      >
        {/* 로딩 인디케이터 (상단) */}
        {isLoadingMessages && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* 메시지 목록 */}
        {messages.map((message, index) => (
          <MessageItem
            key={message.id || `${message.timestamp}-${index}`}
            message={message}
            currentUserId={currentUserId}
          />
        ))}

        {/* 스크롤 앵커 */}
        <div ref={messagesEndRef} />
      </div>

      {/* 아래로 스크롤 버튼 */}
      {showScrollToBottom && (
        <div className="absolute bottom-4 right-4">
          <Button
            onClick={scrollToBottom}
            size="sm"
            className="rounded-full shadow-lg"
            variant="outline"
          >
            <ChevronUp className="w-4 h-4 rotate-180" />
          </Button>
        </div>
      )}
    </div>
  );
}