package com.example.backend.chat.service;

import com.example.backend.chat.dto.response.ChatHistoryResponse;
import com.example.backend.chat.dto.response.RoomResponse;
import com.example.backend.chat.entity.Room;
import com.example.backend.chat.entity.RoomParticipant;
import com.example.backend.common.security.authentication.jwt.JwtUserInfo;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 채팅 도메인의 빌더 패턴을 담당하는 서비스
 */
@Service
public class ChatBuilderService {

    /**
     * Room → RoomResponse (기본)
     */
    public RoomResponse buildRoomResponse(Room room) {
        return RoomResponse.builder()
            .roomId(room.getRoomUuid())
            .roomName(room.getRoomName())
            .creatorId(room.getCreatorId())
            .creatorUsername(room.getCreatorUsername())
            .bigCategory(room.getBigCategory())
            .maxParticipants(room.getMaxParticipants())
            .currentParticipants(room.getCurrentParticipants())
            .isActive(room.getIsActive())
            .createdAt(room.getCreatedAt())
            .updatedAt(room.getUpdatedAt())
            .build();
    }

    /**
     * Room → RoomResponse (메시지 수 포함)
     */
    public RoomResponse buildRoomResponseWithMessageCount(Room room, int messageCount) {
        return RoomResponse.builder()
            .roomId(room.getRoomUuid())
            .roomName(room.getRoomName())
            .creatorId(room.getCreatorId())
            .creatorUsername(room.getCreatorUsername())
            .bigCategory(room.getBigCategory())
            .maxParticipants(room.getMaxParticipants())
            .currentParticipants(room.getCurrentParticipants())
            .isActive(room.getIsActive())
            .createdAt(room.getCreatedAt())
            .updatedAt(room.getUpdatedAt())
            .recentMessageCount(messageCount)
            .build();
    }

    /**
     * Room → RoomResponse (상세 정보 포함)
     */
    public RoomResponse buildDetailedRoomResponse(Room room, int messageCount, List<RoomResponse.ParticipantResponse> participants) {
        return RoomResponse.builder()
            .roomId(room.getRoomUuid())
            .roomName(room.getRoomName())
            .creatorId(room.getCreatorId())
            .creatorUsername(room.getCreatorUsername())
            .bigCategory(room.getBigCategory())
            .maxParticipants(room.getMaxParticipants())
            .currentParticipants(room.getCurrentParticipants())
            .isActive(room.getIsActive())
            .createdAt(room.getCreatedAt())
            .updatedAt(room.getUpdatedAt())
            .recentMessageCount(messageCount)
            .participants(participants)
            .build();
    }

    /**
     * RoomParticipant 생성
     */
    public RoomParticipant buildRoomParticipant(Room room, JwtUserInfo userInfo) {
        return RoomParticipant.builder()
            .room(room)
            .userId(userInfo.userId())
            .username(userInfo.username())
            .isActive(true)
            .build();
    }

    /**
     * ParticipantResponse 생성
     */
    public RoomResponse.ParticipantResponse buildParticipantResponse(RoomParticipant participant) {
        return RoomResponse.ParticipantResponse.builder()
            .userId(participant.getUserId())
            .username(participant.getUsername())
            .isActive(participant.getIsActive())
            .joinedAt(participant.getJoinedAt())
            .leftAt(participant.getLeftAt())
            .build();
    }

    /**
     * ChatHistoryResponse 생성
     */
    public ChatHistoryResponse buildChatHistoryResponse(String roomId, List historyMessages, int totalCount) {
        return ChatHistoryResponse.builder()
            .roomId(roomId)
            .messages(historyMessages)
            .totalCount(totalCount)
            .build();
    }
}