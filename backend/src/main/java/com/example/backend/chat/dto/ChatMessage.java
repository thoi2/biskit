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
    private String sender;
    private String content;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime timestamp;

    // 편의 생성자들
    public ChatMessage(String type, String roomId, String sender, String content) {
        this.type = type;
        this.roomId = roomId;
        this.sender = sender;
        this.content = content;
        this.timestamp = LocalDateTime.now();
    }

    public static ChatMessage createChatMessage(String roomId, String sender, String content) {
        return ChatMessage.builder()
            .type("CHAT")
            .roomId(roomId)
            .sender(sender)
            .content(content)
            .timestamp(LocalDateTime.now())
            .build();
    }

    public static ChatMessage createJoinMessage(String roomId, String sender) {
        return ChatMessage.builder()
            .type("JOIN")
            .roomId(roomId)
            .sender(sender)
            .content(sender + "님이 입장했습니다.")
            .timestamp(LocalDateTime.now())
            .build();
    }

    public static ChatMessage createLeaveMessage(String roomId, String sender) {
        return ChatMessage.builder()
            .type("LEAVE")
            .roomId(roomId)
            .sender(sender)
            .content(sender + "님이 나갔습니다.")
            .timestamp(LocalDateTime.now())
            .build();
    }

    public static ChatMessage createErrorMessage(String roomId, String content) {
        return ChatMessage.builder()
            .type("ERROR")
            .roomId(roomId)
            .sender("시스템")
            .content(content)
            .timestamp(LocalDateTime.now())
            .build();
    }

    public static ChatMessage createHistoryMessage(String roomId, String sender, String content, LocalDateTime timestamp) {
        return ChatMessage.builder()
            .type("HISTORY")
            .roomId(roomId)
            .sender(sender)
            .content(content)
            .timestamp(timestamp)
            .build();
    }
}
