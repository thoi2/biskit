import { useCallback, useEffect, useState } from 'react';
import { useGlobalWebSocket } from '../contexts/WebSocketContext';
import { chatApi } from '../api/chatApi';
import { ChatMessage, ChatError } from '../types/chat';

interface UseChatRoomProps {
  roomId: string;
  currentUserId?: string;
  currentUsername?: string;
}

export const useChatRoom = ({
  roomId,
  currentUserId,
  currentUsername,
}: UseChatRoomProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [error, setError] = useState<ChatError | null>(null);

  // handleNewMessage 함수 제거 - useEffect 내에서 직접 정의하여 의존성 문제 해결

  const {
    connectionStatus: {
      isConnected,
      isConnecting,
      lastError,
      reconnectAttempts,
    },
    subscribe,
    unsubscribe,
    sendMessage: wsSendMessage,
    joinRoom: wsJoinRoom,
    leaveRoom: wsLeaveRoom,
  } = useGlobalWebSocket();

  // 초기 메시지 로드
  const loadRecentMessages = useCallback(async () => {
    if (!roomId) {
      console.log('❌ loadRecentMessages: roomId가 없음');
      return;
    }

    console.log('🔄 최근 메시지 로딩 시작:', roomId);
    try {
      setIsLoadingMessages(true);
      setError(null);
      const recentMessages = await chatApi.getRecentMessages(roomId, 50);
      console.log('✅ Recent messages response:', recentMessages);

      // 실제 메시지 데이터는 body에 있음
      const messagesData = recentMessages.data.body;
      console.log('📊 메시지 데이터:', messagesData);
      console.log(
        '📊 메시지 개수:',
        Array.isArray(messagesData) ? messagesData.length : 'not array',
      );

      const messagesArray = Array.isArray(messagesData) ? messagesData : [];
      console.log('📝 처리된 메시지 배열:', messagesArray);
      console.log('📝 배열 길이:', messagesArray.length);

      // 백엔드에서 이미 오래된 것 -> 최신 순으로 정렬되어 옴 (reverse 불필요)
      setMessages(messagesArray);
      console.log('✅ 메시지 상태 업데이트 완료');
      console.log('📋 최종 메시지 상태:', messagesArray);
    } catch (error: any) {
      console.error('❌ 최근 메시지 로드 실패:', error);
      console.error('❌ 에러 상세:', error.response?.data || error.message);
      const chatError: ChatError = {
        code: 'LOAD_MESSAGES_FAILED',
        message: '최근 메시지를 불러오는데 실패했습니다.',
        details: error,
      };
      setError(chatError);
    } finally {
      setIsLoadingMessages(false);
      console.log('🔄 loadRecentMessages 완료');
    }
  }, [roomId]);

  // 이전 메시지 추가 로드 (무한 스크롤)
  const loadMoreMessages = useCallback(async () => {
    if (!roomId || isLoadingMessages || !hasMoreMessages) return;

    try {
      setIsLoadingMessages(true);
      setError(null);

      // 현재 가장 오래된 메시지의 ID를 cursor로 사용
      const oldestMessage = messages[0];
      if (!oldestMessage?.id) {
        console.log('가장 오래된 메시지의 ID가 없어서 더 불러올 수 없음');
        setHasMoreMessages(false);
        return;
      }

      const olderMessages = await chatApi.getMessagesBefore(
        roomId,
        oldestMessage.id.toString(),
        50,
      );
      const messagesData = olderMessages.data.body;
      console.log('Older messages response:', olderMessages);

      const messagesArray = Array.isArray(messagesData) ? messagesData : [];

      if (messagesArray.length === 0) {
        setHasMoreMessages(false);
      } else {
        // 백엔드에서 오래된 것 -> 최신 순으로 옴, 기존 메시지 앞에 추가
        setMessages(prev => [...messagesArray, ...prev]);
      }
    } catch (error: any) {
      console.error('이전 메시지 로드 실패:', error);
      const chatError: ChatError = {
        code: 'LOAD_MORE_MESSAGES_FAILED',
        message: '이전 메시지를 불러오는데 실패했습니다.',
        details: error,
      };
      setError(chatError);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [roomId, isLoadingMessages, hasMoreMessages, messages]);

  // 메시지 전송
  const sendMessage = useCallback(
    (content: string) => {
      console.log('=== 메시지 전송 시도 ===');
      console.log('content:', content);
      console.log('isConnected:', isConnected);
      console.log('currentUserId:', currentUserId);
      console.log('currentUsername:', currentUsername);

      if (
        !content.trim() ||
        !isConnected ||
        !currentUserId ||
        !currentUsername
      ) {
        console.warn('메시지 전송 조건 실패');
        const chatError: ChatError = {
          code: 'SEND_MESSAGE_FAILED',
          message: !isConnected
            ? '연결이 끊어져 메시지를 전송할 수 없습니다.'
            : '사용자 정보가 없어 메시지를 전송할 수 없습니다.',
        };
        setError(chatError);
        return false;
      }

      try {
        const messageRequest = {
          content,
          senderId: currentUserId,
          senderName: currentUsername,
        };

        const success = wsSendMessage(roomId, messageRequest);
        if (!success) {
          const chatError: ChatError = {
            code: 'SEND_MESSAGE_FAILED',
            message: '메시지 전송에 실패했습니다.',
          };
          setError(chatError);
        }
        return success;
      } catch (error: any) {
        const chatError: ChatError = {
          code: 'SEND_MESSAGE_FAILED',
          message: '메시지 전송 중 오류가 발생했습니다.',
          details: error,
        };
        setError(chatError);
        return false;
      }
    },
    [roomId, isConnected, wsSendMessage, currentUserId, currentUsername],
  );

  // joinRoom, leaveRoom 함수 제거 - useEffect에서 직접 처리하여 중복 호출 방지

  // 초기 메시지 로드
  useEffect(() => {
    console.log('🎯 useEffect - 초기 메시지 로드:', { roomId });
    if (roomId) {
      loadRecentMessages();
    } else {
      console.log('❌ roomId가 없어서 메시지 로드 건너뜀');
    }
  }, [roomId]); // loadRecentMessages 제거

  // 방 입장 - roomId 변경 시에만 실행
  useEffect(() => {
    if (!roomId) return;

    console.log('🎯 새 방 설정:', roomId);

    // isConnected 상태와 상관없이 일단 구독 설정 시도
    const handleMessage = (message: ChatMessage) => {
      console.log('=== 새 메시지 수신 ===', message);
      setMessages(prev => {
        if (
          message.messageId &&
          prev.some(m => m.messageId === message.messageId)
        ) {
          console.log('중복 메시지 무시:', message.messageId);
          return prev;
        }
        console.log('메시지 목록에 추가:', message.content);
        return [...prev, message];
      });
    };

    subscribe(`/topic/room.${roomId}`, handleMessage);

    return () => {
      console.log('🚪 방 나가기 - 구독 해제:', roomId);
      unsubscribe(`/topic/room.${roomId}`);
    };
  }, [roomId]); // roomId만 의존성으로 - 함수 의존성 완전 제거

  // WebSocket 연결 시 입장 알림
  useEffect(() => {
    if (roomId && isConnected) {
      console.log('🚪 WebSocket 연결됨 - 방 입장 알림:', roomId);
      wsJoinRoom(roomId);
    }
  }, [roomId, isConnected]); // 연결 상태 변경 시에만

  // 에러 초기화
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // messages 상태 변화 추적
  useEffect(() => {
    console.log('📊 messages 상태 변경됨:', {
      length: messages.length,
      messages: messages,
    });
  }, [messages]);

  return {
    messages,
    isLoadingMessages,
    hasMoreMessages,
    isConnected,
    isConnecting,
    error: error || lastError,
    reconnectAttempts,
    sendMessage,
    loadMoreMessages,
    clearError,
  };
};
