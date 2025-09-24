package com.example.backend.chat.dto.response;

import com.example.backend.chat.dto.ChatMessage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 채팅 히스토리 응답 DTO
 * 새 참가자에게 이전 메시지들을 일괄 전송하기 위한 응답 객체
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatHistoryResponse {

    private String roomId;
    private List<ChatMessage> messages;
    private int totalCount;
    @Builder.Default
    private String type = "HISTORY_BATCH";
}