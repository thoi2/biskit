package com.example.backend.chat.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 채팅방 응답 DTO
 */
@Builder
public record RoomResponse(
    String roomId,
    String roomName,
    String creatorId,
    String creatorUsername,
    Integer maxParticipants,
    Integer currentParticipants,
    Boolean isActive,

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    LocalDateTime createdAt,

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    LocalDateTime updatedAt,

    // 선택적 필드들
    Integer recentMessageCount,
    List<ParticipantResponse> participants
) {

    /**
     * 기본 방 정보만 포함하는 생성자
     */
    public static RoomResponse of(String roomId, String roomName, String creatorId,
                                 String creatorUsername, Integer maxParticipants,
                                 Integer currentParticipants, LocalDateTime createdAt) {
        return RoomResponse.builder()
            .roomId(roomId)
            .roomName(roomName)
            .creatorId(creatorId)
            .creatorUsername(creatorUsername)
            .maxParticipants(maxParticipants)
            .currentParticipants(currentParticipants)
            .isActive(true)
            .createdAt(createdAt)
            .build();
    }

    /**
     * 참여자 응답 DTO
     */
    @Builder
    public record ParticipantResponse(
        String userId,
        String username,
        Boolean isActive,

        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime joinedAt,

        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime leftAt
    ) {}
}