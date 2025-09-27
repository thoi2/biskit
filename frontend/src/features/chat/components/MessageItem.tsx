'use client';

import { ChatMessage as ChatMessageType } from '../types/chat';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Avatar } from './Avatar';

interface ChatMessageProps {
  message: ChatMessageType;
  currentUserId?: string;
}

export function MessageItem({ message, currentUserId }: ChatMessageProps) {
  const isSystemMessage = ['JOIN', 'LEAVE', 'ERROR'].includes(message.type);
  const isMyMessage = currentUserId && message.senderId === currentUserId;

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return formatDistanceToNow(date, {
        addSuffix: true,
        locale: ko
      });
    } catch {
      return '';
    }
  };

  if (isSystemMessage) {
    return (
      <div className="flex justify-center my-2">
        <div className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
          {message.content}
        </div>
      </div>
    );
  }

  if (message.type === 'ERROR') {
    return (
      <div className="flex justify-center my-2">
        <div className="px-3 py-1 bg-red-100 rounded-full text-sm text-red-600">
          ⚠️ {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex mb-4 ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex gap-2 max-w-xs lg:max-w-md ${isMyMessage ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* 프로필 아바타 */}
        <Avatar
          src={message.profileImageUrl}
          name={message.senderName}
          size="sm"
          className="flex-shrink-0 mt-1"
        />

        {/* 메시지 내용 */}
        <div className="flex flex-col">
          {/* 사용자 이름 */}
          <div className={`text-sm text-gray-600 mb-1 px-1 ${
            isMyMessage ? 'text-right' : 'text-left'
          }`}>
            {message.senderName}
          </div>

          {/* 메시지 버블 */}
          <div
            className={`px-4 py-2 rounded-lg ${
              isMyMessage
                ? 'bg-blue-500 text-white rounded-br-none'
                : 'bg-gray-200 text-gray-800 rounded-bl-none'
            }`}
          >
            <div className="break-words">{message.content}</div>
          </div>

          {/* 시간 */}
          <div
            className={`text-xs text-gray-500 mt-1 px-1 ${
              isMyMessage ? 'text-right' : 'text-left'
            }`}
          >
            {formatTime(message.timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
}