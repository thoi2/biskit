import { useCallback, useEffect, useState } from 'react';
import { useWebSocket } from './useWebSocket';
import { chatApi } from '../api/chatApi';
import { ChatMessage, ChatError } from '../types/chat';

interface UseChatRoomProps {
  roomId: string;
  wsUrl?: string;
  currentUserId?: string;
  currentUsername?: string;
}

export const useChatRoom = ({
  roomId,
  wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8080/ws',
  currentUserId,
  currentUsername
}: UseChatRoomProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [error, setError] = useState<ChatError | null>(null);

  const handleWebSocketError = useCallback((wsError: ChatError) => {
    console.error('WebSocket 에러:', wsError);
    setError(wsError);
  }, []);

  const handleNewMessage = useCallback((message: ChatMessage) => {
    console.log('=== 새 메시지 수신 ===', message);
    setMessages(prev => {
      // 중복 메시지 방지
      if (prev.some(m => m.id === message.id)) {
        console.log('중복 메시지 무시:', message.id);
        return prev;
      }
      console.log('메시지 목록에 추가:', message.content);
      return [...prev, message];
    });
  }, []);

  const {
    isConnected,
    isConnecting,
    lastError,
    reconnectAttempts,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    sendMessage: wsSendMessage,
    joinRoom: wsJoinRoom,
    leaveRoom: wsLeaveRoom
  } = useWebSocket({
    url: wsUrl,
    onMessage: handleNewMessage,
    onError: handleWebSocketError,
    onConnect: () => {
      console.log('채팅방 WebSocket 연결됨');
      setError(null);
    },
    onDisconnect: () => console.log('채팅방 WebSocket 연결 해제됨')
  });

  // 초기 메시지 로드
  const loadRecentMessages = useCallback(async () => {
    if (!roomId) return;

    try {
      setIsLoadingMessages(true);
      setError(null);
      const recentMessages = await chatApi.getRecentMessages(roomId, 50);
      console.log('Recent messages response:', recentMessages);
      const messagesArray = Array.isArray(recentMessages) ? recentMessages : [];
      setMessages(messagesArray.reverse()); // 최신 메시지가 아래로
    } catch (error: any) {
      console.error('최근 메시지 로드 실패:', error);
      const chatError: ChatError = {
        code: 'LOAD_MESSAGES_FAILED',
        message: '최근 메시지를 불러오는데 실패했습니다.',
        details: error
      };
      setError(chatError);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [roomId]);

  // 메시지 전송
  const sendMessage = useCallback((content: string) => {
    console.log('=== 메시지 전송 시도 ===');
    console.log('content:', content);
    console.log('isConnected:', isConnected);
    console.log('currentUserId:', currentUserId);
    console.log('currentUsername:', currentUsername);

    if (!content.trim() || !isConnected || !currentUserId || !currentUsername) {
      console.warn('메시지 전송 조건 실패');
      const chatError: ChatError = {
        code: 'SEND_MESSAGE_FAILED',
        message: !isConnected ? '연결이 끊어져 메시지를 전송할 수 없습니다.' : '사용자 정보가 없어 메시지를 전송할 수 없습니다.'
      };
      setError(chatError);
      return false;
    }

    try {
      const messageRequest = {
        content,
        senderId: currentUserId,
        senderName: currentUsername
      };

      const success = wsSendMessage(roomId, messageRequest);
      if (!success) {
        const chatError: ChatError = {
          code: 'SEND_MESSAGE_FAILED',
          message: '메시지 전송에 실패했습니다.'
        };
        setError(chatError);
      }
      return success;
    } catch (error: any) {
      const chatError: ChatError = {
        code: 'SEND_MESSAGE_FAILED',
        message: '메시지 전송 중 오류가 발생했습니다.',
        details: error
      };
      setError(chatError);
      return false;
    }
  }, [roomId, isConnected, wsSendMessage, currentUserId, currentUsername]);

  // 방 입장
  const joinRoom = useCallback(() => {
    if (!isConnected) return;

    // 방 메시지 구독
    subscribe(`/topic/room.${roomId}`, handleNewMessage);

    // 방 입장 알림
    wsJoinRoom(roomId);
  }, [roomId, isConnected, subscribe, wsJoinRoom, handleNewMessage]);

  // 방 나가기
  const leaveRoom = useCallback(() => {
    if (!isConnected) return;

    // 구독 해제
    unsubscribe(`/topic/room.${roomId}`);

    // 방 나가기 알림
    wsLeaveRoom(roomId);
  }, [roomId, isConnected, unsubscribe, wsLeaveRoom]);

  // 초기 연결 및 메시지 로드
  useEffect(() => {
    if (roomId) {
      loadRecentMessages();
      connect();
    }

    return () => {
      leaveRoom();
      disconnect();
    };
  }, [roomId]);

  // 연결 후 방 입장
  useEffect(() => {
    if (isConnected && roomId) {
      joinRoom();
    }
  }, [isConnected, roomId, joinRoom]);

  // 에러 초기화
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    messages,
    isLoadingMessages,
    hasMoreMessages,
    isConnected,
    isConnecting,
    error: error || lastError,
    reconnectAttempts,
    sendMessage,
    joinRoom,
    leaveRoom,
    clearError
  };
};