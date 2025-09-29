package com.example.backend.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 채팅방 정보 DTO
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Room {

    private String roomId; // roomUuid
    private String roomName;
    private String creatorId;
    private String creatorUsername;
    private String bigCategory; // 상권업종대분류명
    private Boolean isActive;
    private Integer maxParticipants;
    private Integer currentParticipants;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // 참여자 정보 (선택적)
    private List<ParticipantDto> participants;

    /**
     * 참여자 정보 DTO
     */
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ParticipantDto {
        private String userId;
        private String username;
        private Boolean isActive;
        private LocalDateTime joinedAt;
        private LocalDateTime leftAt;
    }
}