package com.example.backend.chat.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import com.example.backend.chat.dto.ChatMessage;
import com.example.backend.chat.dto.request.ChatMessageRequest;
import com.example.backend.chat.service.ChatService;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatStompController {

    private final ChatService chatService;

    /**
     * 채팅 메시지 전송
     */
    @MessageMapping("/chat.sendMessage/{roomId}")
    @SendTo("/topic/room.{roomId}")
    public ChatMessage sendMessage(@DestinationVariable String roomId,
                                   ChatMessageRequest request,
                                   SimpMessageHeaderAccessor headerAccessor) {

        try {
            log.info("=== 메시지 전송 요청 수신 ===");
            log.info("방ID: {}, 메시지: {}", roomId, request.getContent());

            // 입력 값 검증
            if (request.getContent() == null || request.getContent().trim().isEmpty()) {
                throw new IllegalArgumentException("메시지 내용은 필수입니다.");
            }

            if (request.getContent().length() > 1000) {
                throw new IllegalArgumentException("메시지는 1000자를 초과할 수 없습니다.");
            }

            ChatMessage result = chatService.sendMessage(roomId, request.getContent(), headerAccessor);
            log.info("=== 메시지 전송 완료 ===");
            return result;
        } catch (Exception e) {
            log.error("메시지 전송 중 오류 발생: roomId={}, content={}", roomId, request.getContent(), e);
            throw e; // MessageExceptionHandler가 처리
        }
    }

    /**
     * 방 입장
     */
    @MessageMapping("/chat.joinRoom/{roomId}")
    @SendTo("/topic/room.{roomId}")
    public ChatMessage joinRoom(@DestinationVariable String roomId,
                                SimpMessageHeaderAccessor headerAccessor) {

        try {
            log.info("=== 방 입장 요청 수신 ===");
            log.info("방ID: {}", roomId);

            // 방 ID 검증
            if (roomId == null || roomId.trim().isEmpty()) {
                throw new IllegalArgumentException("방 ID는 필수입니다.");
            }

            ChatMessage result = chatService.joinRoom(roomId, headerAccessor);
            log.info("=== 방 입장 완료 ===");
            return result;
        } catch (Exception e) {
            log.error("방 입장 중 오류 발생: roomId={}", roomId, e);
            throw e; // MessageExceptionHandler가 처리
        }
    }

    /**
     * 방 나가기 (임시 나가기 - 메시지 전송하지 않음)
     */
    @MessageMapping("/chat.leaveRoom/{roomId}")
    public void leaveRoom(@DestinationVariable String roomId,
                          SimpMessageHeaderAccessor headerAccessor) {

        try {
            log.info("=== 방 나가기 요청 수신 ===");
            log.info("방ID: {}", roomId);

            // 방 ID 검증
            if (roomId == null || roomId.trim().isEmpty()) {
                throw new IllegalArgumentException("방 ID는 필수입니다.");
            }

            chatService.leaveRoom(roomId, headerAccessor);
            log.info("=== 방 나가기 완료 ===");
            // @SendTo 제거: 임시 나가기는 다른 사용자들에게 알리지 않음
        } catch (Exception e) {
            log.error("방 나가기 중 오류 발생: roomId={}", roomId, e);
            // 나가기는 에러가 발생해도 클라이언트에 전파하지 않음
        }
    }






    /**
     * WebSocket 메시지 처리 중 발생한 예외를 처리하는 핸들러
     * 클라이언트의 에러 큐로 에러 메시지를 전송합니다.
     */
    @MessageExceptionHandler
    @SendToUser("/queue/errors")
    public ChatMessage handleException(Exception exception, SimpMessageHeaderAccessor headerAccessor) {

        log.error("STOMP 메시지 처리 중 예외 발생", exception);

        // 예외 타입별 세분화된 처리
        String errorMessage;
        String errorCode;

        if (exception instanceof IllegalArgumentException) {
            errorCode = "INVALID_INPUT";
            errorMessage = exception.getMessage();
        } else if (exception.getCause() != null && exception.getCause().getClass().getSimpleName().contains("BusinessException")) {
            errorCode = "BUSINESS_ERROR";
            errorMessage = exception.getMessage();
        } else {
            errorCode = "UNKNOWN_ERROR";
            errorMessage = "처리 중 오류가 발생했습니다.";
        }

        // 상세한 에러 메시지 생성
        ChatMessage errorResponse = chatService.createErrorMessage(headerAccessor, exception);

        // 에러 코드 추가 (기존 content에 추가)
        errorResponse.setContent(String.format("[%s] %s", errorCode, errorResponse.getContent()));

        return errorResponse;
    }
}