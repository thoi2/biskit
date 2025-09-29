package com.example.backend.chat.dto.request;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * 채팅 메시지 전송 요청 DTO
 * 클라이언트에서 메시지 전송 시 필요한 정보를 담는 요청 객체
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageRequest {

    private String content;
    private String senderId;     // 선택적 - JWT에서 추출 가능
    private String senderName;   // 선택적 - JWT에서 추출 가능
}