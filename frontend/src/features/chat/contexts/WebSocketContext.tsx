'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuthStore } from '@/features/auth/store/authStore';
import { ChatMessage, ChatError, ConnectionStatus } from '../types/chat';

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

interface WebSocketContextType {
  connectionStatus: ConnectionStatus;
  subscribe: (destination: string, callback: (message: any) => void) => any;
  unsubscribe: (destination: string) => void;
  publish: (destination: string, body?: any) => boolean;
  sendMessage: (roomId: string, messageRequest: any) => boolean;
  joinRoom: (roomId: string) => boolean;
  leaveRoom: (roomId: string) => boolean;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
  children: React.ReactNode;
  url?: string;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
  url = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8080/ws'
}) => {
  const { isLoggedIn } = useAuthStore();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    isConnecting: false,
    reconnectAttempts: 0
  });

  const clientRef = useRef<Client | null>(null);
  const subscriptionsRef = useRef<Map<string, any>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxReconnectAttempts = 5;

  const handleError = (error: any) => {
    const chatError: ChatError = {
      code: error.code || 'WEBSOCKET_ERROR',
      message: error.message || '웹소켓 연결 오류가 발생했습니다.',
      details: error
    };

    setConnectionStatus(prev => ({
      ...prev,
      lastError: chatError
    }));

    console.error('WebSocket Error:', chatError);
  };

  const connect = () => {
    if (clientRef.current?.connected || !isLoggedIn) return;

    setConnectionStatus(prev => ({
      ...prev,
      isConnecting: true,
      lastError: undefined
    }));

    console.log('Global WebSocket 연결 시도 URL:', url);
    const socket = new SockJS(url, null, {
      withCredentials: true
    });

    // 연결 시마다 쿠키에서 액세스 토큰을 새로 읽기
    const accessToken = getCookieValue('accessToken');
    const connectHeaders: Record<string, string> = {};

    console.log('=== Global 토큰 확인 ===');
    console.log('accessToken:', accessToken ? `${accessToken.substring(0, 20)}...` : 'null');

    if (accessToken) {
      connectHeaders['Authorization'] = `Bearer ${accessToken}`;
      console.log('Global WebSocket 연결에 Authorization 헤더 추가됨');
    } else {
      console.warn('accessToken 쿠키를 찾을 수 없음');
    }

    const client = new Client({
      webSocketFactory: () => socket,
      debug: (str) => console.log('Global STOMP Debug:', str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      connectHeaders,
      onConnect: () => {
        console.log('Global WebSocket 연결됨');
        setConnectionStatus(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          reconnectAttempts: 0,
          lastError: undefined
        }));
      },
      onDisconnect: () => {
        console.log('Global WebSocket 연결 해제됨');
        setConnectionStatus(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false
        }));

        // 로그인 상태에서만 자동 재연결 시도
        if (isLoggedIn) {
          setConnectionStatus(prev => {
            if (prev.reconnectAttempts < maxReconnectAttempts) {
              const delay = Math.min(1000 * Math.pow(2, prev.reconnectAttempts), 30000);

              reconnectTimeoutRef.current = setTimeout(() => {
                console.log(`Global 재연결 시도 ${prev.reconnectAttempts + 1}/${maxReconnectAttempts}`);
                connect();
              }, delay);

              return {
                ...prev,
                reconnectAttempts: prev.reconnectAttempts + 1
              };
            } else {
              console.warn('Global 최대 재연결 시도 횟수 도달');
              return prev;
            }
          });
        }
      },
      onStompError: (frame) => {
        console.error('Global STOMP 에러:', frame);
        setConnectionStatus(prev => ({
          ...prev,
          isConnecting: false
        }));
        handleError(frame);
      }
    });

    clientRef.current = client;
    client.activate();
  };

  const disconnect = () => {
    console.log('Global WebSocket 연결 해제 시도');

    // 재연결 타이머 정리
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (clientRef.current) {
      try {
        // 모든 구독 해제
        subscriptionsRef.current.forEach((subscription) => {
          subscription.unsubscribe();
        });
        subscriptionsRef.current.clear();

        if (clientRef.current.connected) {
          clientRef.current.deactivate();
        }
      } catch (error) {
        console.warn('Global 클라이언트 해제 중 오류:', error);
      } finally {
        clientRef.current = null;
      }
    }

    setConnectionStatus({
      isConnected: false,
      isConnecting: false,
      reconnectAttempts: 0
    });

    console.log('Global WebSocket 연결 해제 완료');
  };

  const subscribe = (destination: string, callback: (message: any) => void) => {
    if (!clientRef.current?.connected) {
      handleError({
        code: 'NOT_CONNECTED',
        message: '웹소켓이 연결되지 않았습니다.'
      });
      return;
    }

    try {
      const subscription = clientRef.current.subscribe(destination, (message) => {
        try {
          const data = JSON.parse(message.body);
          callback(data);
        } catch (error) {
          console.error('메시지 파싱 에러:', error);
          handleError({
            code: 'MESSAGE_PARSE_ERROR',
            message: '메시지 파싱 중 오류가 발생했습니다.',
            details: error
          });
        }
      });

      subscriptionsRef.current.set(destination, subscription);
      return subscription;
    } catch (error) {
      handleError({
        code: 'SUBSCRIPTION_ERROR',
        message: '구독 설정 중 오류가 발생했습니다.',
        details: error
      });
    }
  };

  const unsubscribe = (destination: string) => {
    const subscription = subscriptionsRef.current.get(destination);
    if (subscription) {
      subscription.unsubscribe();
      subscriptionsRef.current.delete(destination);
    }
  };

  const publish = (destination: string, body?: any) => {
    if (!clientRef.current?.connected) {
      handleError({
        code: 'NOT_CONNECTED',
        message: '웹소켓이 연결되지 않았습니다.'
      });
      return false;
    }

    try {
      clientRef.current.publish({
        destination,
        body: body ? JSON.stringify(body) : ''
      });
      return true;
    } catch (error) {
      handleError({
        code: 'PUBLISH_ERROR',
        message: '메시지 전송 중 오류가 발생했습니다.',
        details: error
      });
      return false;
    }
  };

  const sendMessage = (roomId: string, messageRequest: any) => {
    return publish(`/app/chat.sendMessage/${roomId}`, messageRequest);
  };

  const joinRoom = (roomId: string) => {
    return publish(`/app/chat.joinRoom/${roomId}`);
  };

  const leaveRoom = (roomId: string) => {
    return publish(`/app/chat.leaveRoom/${roomId}`);
  };

  // 로그인 상태 변경 시 연결/해제
  useEffect(() => {
    if (isLoggedIn) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isLoggedIn]);

  const contextValue: WebSocketContextType = {
    connectionStatus,
    subscribe,
    unsubscribe,
    publish,
    sendMessage,
    joinRoom,
    leaveRoom
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useGlobalWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useGlobalWebSocket must be used within WebSocketProvider');
  }
  return context;
};