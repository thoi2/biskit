import apiClient from '@/lib/apiClient';
import { ChatMessage, Room, RoomCreateRequest } from '../types/chat';

export const chatApi = {
  // 채팅방 생성
  createRoom: (
    request: RoomCreateRequest,
  ): Promise<{ data: { body: Room; status: number; success: boolean } }> =>
    apiClient.post('/chat/rooms', request),

  // 공개 채팅방 목록 조회 (페이징 지원)
  getPublicRooms: (
    bigCategory?: string,
    limit = 20,
    cursor?: string,
  ): Promise<{
    data: {
      body: {
        rooms: Room[];
        nextCursor?: string;
        hasMore: boolean;
        totalCount: number;
      };
    };
  }> => {
    const params: Record<string, any> = { limit };

    if (bigCategory) {
      params.bigCategory = bigCategory;
    }

    if (cursor) {
      params.cursor = cursor;
    }

    console.log('=== getPublicRooms API 호출 ===');
    console.log('bigCategory:', bigCategory);
    console.log('최종 params:', params);

    return apiClient.get('/chat/rooms/public', { params });
  },

  // 내가 참여한 채팅방 목록 조회
  getUserRooms: (): Promise<{ data: { body: Room[] } }> =>
    apiClient.get('/chat/rooms'),

  // 채팅방 정보 조회
  getRoomInfo: (
    roomId: string,
  ): Promise<{ data: { body: Room; status: number; success: boolean } }> =>
    apiClient.get(`/chat/rooms/${roomId}`),

  // 방 참여하기 (REST API가 없으면 공개방 목록에서 정보 찾기)
  findRoomInPublicList: (roomId: string): Promise<Room | null | undefined> =>
    chatApi.getPublicRooms().then(response => {
      const room = response.data.body.rooms.find(r => r.roomId === roomId);
      return room || null;
    }),

  // 채팅방 나가기
  leaveRoom: (
    roomId: string,
  ): Promise<{ data: { body: string; status: number; success: boolean } }> =>
    apiClient.delete(`/chat/rooms/${roomId}/leave`),

  // 최근 메시지 조회
  getRecentMessages: (
    roomId: string,
    limit = 50,
  ): Promise<{
    data: { body: ChatMessage[]; status: number; success: boolean };
  }> =>
    apiClient.get(`/chat/rooms/${roomId}/messages`, {
      params: { limit },
    }),

  // 이전 메시지 조회 (무한 스크롤용)
  getMessagesBefore: (
    roomId: string,
    cursor: string,
    limit = 50,
  ): Promise<{
    data: { body: ChatMessage[]; status: number; success: boolean };
  }> =>
    apiClient.get(`/chat/rooms/${roomId}/messages/before`, {
      params: { cursor, limit },
    }),
};
