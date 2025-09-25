package com.example.backend.chat.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {

    private String id;
    private String type; // "JOIN", "CHAT", "LEAVE", "TYPING", "HISTORY", "ERROR"
    private String roomId;
    private String senderId;        // 사용자 ID (구분용)
    private String senderName;      // 사용자 이름 (표시용)
    private String profileImageUrl; // 프로필 이미지 URL
    private String content;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime timestamp;

    public static ChatMessage createChatMessage(String roomId, String senderId, String senderName, String profileImageUrl, String content) {
        return ChatMessage.builder()
            .type("CHAT")
            .roomId(roomId)
            .senderId(senderId)
            .senderName(senderName)
            .profileImageUrl(profileImageUrl)
            .content(content)
            .timestamp(LocalDateTime.now())
            .build();
    }

    public static ChatMessage createJoinMessage(String roomId, String senderId, String senderName, String profileImageUrl) {
        return ChatMessage.builder()
            .type("JOIN")
            .roomId(roomId)
            .senderId(senderId)
            .senderName(senderName)
            .profileImageUrl(profileImageUrl)
            .content(senderName + "님이 입장했습니다.")
            .timestamp(LocalDateTime.now())
            .build();
    }

    public static ChatMessage createLeaveMessage(String roomId, String senderId, String senderName, String profileImageUrl) {
        return ChatMessage.builder()
            .type("LEAVE")
            .roomId(roomId)
            .senderId(senderId)
            .senderName(senderName)
            .profileImageUrl(profileImageUrl)
            .content(senderName + "님이 나갔습니다.")
            .timestamp(LocalDateTime.now())
            .build();
    }

    public static ChatMessage createErrorMessage(String roomId, String content) {
        return ChatMessage.builder()
            .type("ERROR")
            .roomId(roomId)
            .senderId("system")
            .senderName("시스템")
            .content(content)
            .timestamp(LocalDateTime.now())
            .build();
    }

    public static ChatMessage createHistoryMessage(String roomId, String senderId, String senderName, String profileImageUrl, String content, LocalDateTime timestamp) {
        return ChatMessage.builder()
            .type("HISTORY")
            .roomId(roomId)
            .senderId(senderId)
            .senderName(senderName)
            .profileImageUrl(profileImageUrl)
            .content(content)
            .timestamp(timestamp)
            .build();
    }
}
