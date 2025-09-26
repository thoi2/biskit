export interface ChatMessage {
  id?: number | null; // Long ID from backend, nullable
  messageId?: string | null; // nullable in backend
  type: 'JOIN' | 'CHAT' | 'LEAVE' | 'TYPING' | 'HISTORY' | 'ERROR';
  roomId: string;
  senderId: string;        // 사용자 ID (구분용)
  senderName: string;      // 사용자 이름 (표시용)
  profileImageUrl?: string; // 프로필 이미지 URL (옵셔널)
  content: string;
  timestamp: string;       // ISO string 형태 (yyyy-MM-dd HH:mm:ss)
}

export interface Room {
  roomId: string;
  roomName: string;
  creatorId: string;
  creatorUsername: string;
  bigCategory?: string; // 상권업종대분류명 (소매, 음식, 교육 등)
  isActive?: boolean;
  maxParticipants: number;
  currentParticipants: number;
  createdAt: string;    // ISO string 형태 (yyyy-MM-dd HH:mm:ss)
  updatedAt?: string;   // ISO string 형태 (yyyy-MM-dd HH:mm:ss)
  recentMessageCount?: number | null; // nullable in backend
  participants?: ParticipantResponse[] | null; // nullable in backend
}

export interface ParticipantResponse {
  userId: string;
  username: string;
  isActive?: boolean;
  joinedAt: string;     // ISO string 형태 (yyyy-MM-dd HH:mm:ss)
  leftAt?: string;      // ISO string 형태 (yyyy-MM-dd HH:mm:ss)
}

export interface RoomCreateRequest {
  roomName: string;
  bigCategory?: string; // 상권업종대분류명
  maxParticipants?: number;
}

export interface ChatMessageRequest {
  content: string;
  senderId?: string;
  senderName?: string;
}

export interface ChatHistoryResponse {
  roomId: string;
  messages: ChatMessage[];
  totalCount: number;
  type: string;
}

// 에러 처리를 위한 타입들
export interface ChatError {
  code: string;
  message: string;
  details?: any;
}

export interface ConnectionStatus {
  isConnected: boolean;
  isConnecting: boolean;
  lastError?: ChatError;
  reconnectAttempts: number;
}

// WebSocket 이벤트 타입들
export type WebSocketEventType =
  | 'connect'
  | 'disconnect'
  | 'error'
  | 'message'
  | 'reconnect';

export interface WebSocketEvent {
  type: WebSocketEventType;
  data?: any;
  error?: ChatError;
  timestamp: string;
}