import { useCallback, useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import {
  ChatMessage,
  ChatMessageRequest,
  ChatError,
  ConnectionStatus,
} from '../types/chat';

// 쿠키에서 토큰 읽기 유틸리티
const getCookieValue = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const part = parts.pop();
    return part ? part.split(';').shift() || null : null;
  }
  return null;
};

interface UseWebSocketProps {
  url: string;
  onMessage?: (message: ChatMessage) => void;
  onError?: (error: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export const useWebSocket = ({
  url,
  onMessage,
  onError,
  onConnect,
  onDisconnect,
}: UseWebSocketProps) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    isConnecting: false,
    reconnectAttempts: 0,
  });
  const clientRef = useRef<Client | null>(null);
  const subscriptionsRef = useRef<Map<string, any>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxReconnectAttempts = 5;

  const handleError = useCallback(
    (error: any) => {
      const chatError: ChatError = {
        code: error.code || 'WEBSOCKET_ERROR',
        message: error.message || '웹소켓 연결 오류가 발생했습니다.',
        details: error,
      };

      setConnectionStatus(prev => ({
        ...prev,
        lastError: chatError,
      }));

      onError?.(chatError);
    },
    [onError],
  );

  const connect = useCallback(() => {
    if (clientRef.current?.connected) return;

    setConnectionStatus(prev => ({
      ...prev,
      isConnecting: true,
      lastError: undefined,
    }));

    console.log('WebSocket 연결 시도 URL:', url);
    const socket = new SockJS(url, null, {
      // withCredentials: true
    });
    console.log('SockJS 소켓 생성됨:', socket);

    // 연결 시마다 쿠키에서 액세스 토큰을 새로 읽기
    const accessToken = getCookieValue('accessToken');
    const connectHeaders: Record<string, string> = {};

    console.log('=== 토큰 확인 (재연결) ===');
    console.log(
      'accessToken:',
      accessToken ? `${accessToken.substring(0, 20)}...` : 'null',
    );

    if (accessToken) {
      connectHeaders['Authorization'] = `Bearer ${accessToken}`;
      console.log('WebSocket 연결에 Authorization 헤더 추가됨');
    } else {
      console.warn('accessToken 쿠키를 찾을 수 없음');
    }

    const client = new Client({
      webSocketFactory: () => socket,
      debug: str => console.log('STOMP Debug:', str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      connectHeaders,
      onConnect: () => {
        console.log('WebSocket 연결됨');
        setConnectionStatus(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          reconnectAttempts: 0,
          lastError: undefined,
        }));
        onConnect?.();
      },
      onDisconnect: () => {
        console.log('WebSocket 연결 해제됨');
        setConnectionStatus(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
        }));

        // 자동 재연결 시도 (상태 기반으로 재시도 횟수 관리)
        setConnectionStatus(prev => {
          if (prev.reconnectAttempts < maxReconnectAttempts) {
            const delay = Math.min(
              1000 * Math.pow(2, prev.reconnectAttempts),
              30000,
            );

            reconnectTimeoutRef.current = setTimeout(() => {
              console.log(
                `재연결 시도 ${
                  prev.reconnectAttempts + 1
                }/${maxReconnectAttempts}`,
              );
              connect();
            }, delay);

            return {
              ...prev,
              reconnectAttempts: prev.reconnectAttempts + 1,
            };
          } else {
            console.warn('최대 재연결 시도 횟수 도달');
            return prev;
          }
        });

        onDisconnect?.();
      },
      onStompError: frame => {
        console.error('STOMP 에러:', frame);
        setConnectionStatus(prev => ({
          ...prev,
          isConnecting: false,
        }));
        handleError(frame);
      },
    });

    clientRef.current = client;
    client.activate();
  }, [url, onConnect, onDisconnect, handleError]);

  const disconnect = useCallback(() => {
    console.log('WebSocket 연결 해제 시도');

    // 재연결 타이머 정리
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (clientRef.current) {
      try {
        // 모든 구독 해제
        subscriptionsRef.current.forEach(subscription => {
          subscription.unsubscribe();
        });
        subscriptionsRef.current.clear();

        if (clientRef.current.connected) {
          clientRef.current.deactivate();
        }
      } catch (error) {
        console.warn('클라이언트 해제 중 오류:', error);
      } finally {
        clientRef.current = null;
      }
    }

    setConnectionStatus({
      isConnected: false,
      isConnecting: false,
      reconnectAttempts: 0,
    });

    console.log('WebSocket 연결 해제 완료');
  }, []);

  const subscribe = useCallback(
    (destination: string, callback: (message: any) => void) => {
      if (!clientRef.current?.connected) {
        handleError({
          code: 'NOT_CONNECTED',
          message: '웹소켓이 연결되지 않았습니다.',
        });
        return;
      }

      try {
        const subscription = clientRef.current.subscribe(
          destination,
          message => {
            try {
              const data = JSON.parse(message.body);
              callback(data);
            } catch (error) {
              console.error('메시지 파싱 에러:', error);
              handleError({
                code: 'MESSAGE_PARSE_ERROR',
                message: '메시지 파싱 중 오류가 발생했습니다.',
                details: error,
              });
            }
          },
        );

        subscriptionsRef.current.set(destination, subscription);
        return subscription;
      } catch (error) {
        handleError({
          code: 'SUBSCRIPTION_ERROR',
          message: '구독 설정 중 오류가 발생했습니다.',
          details: error,
        });
      }
    },
    [handleError],
  );

  const unsubscribe = useCallback((destination: string) => {
    const subscription = subscriptionsRef.current.get(destination);
    if (subscription) {
      subscription.unsubscribe();
      subscriptionsRef.current.delete(destination);
    }
  }, []);

  const publish = useCallback(
    (destination: string, body?: any) => {
      if (!clientRef.current?.connected) {
        handleError({
          code: 'NOT_CONNECTED',
          message: '웹소켓이 연결되지 않았습니다.',
        });
        return false;
      }

      try {
        clientRef.current.publish({
          destination,
          body: body ? JSON.stringify(body) : '',
        });
        return true;
      } catch (error) {
        handleError({
          code: 'PUBLISH_ERROR',
          message: '메시지 전송 중 오류가 발생했습니다.',
          details: error,
        });
        return false;
      }
    },
    [handleError],
  );

  const sendMessage = useCallback(
    (roomId: string, messageRequest: any) => {
      return publish(`/app/chat.sendMessage/${roomId}`, messageRequest);
    },
    [publish],
  );

  const joinRoom = useCallback(
    (roomId: string) => {
      return publish(`/app/chat.joinRoom/${roomId}`);
    },
    [publish],
  );

  const leaveRoom = useCallback(
    (roomId: string) => {
      return publish(`/app/chat.leaveRoom/${roomId}`);
    },
    [publish],
  );

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    ...connectionStatus,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    publish,
    sendMessage,
    joinRoom,
    leaveRoom,
  };
};
