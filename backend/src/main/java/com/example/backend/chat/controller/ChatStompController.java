package com.example.backend.chat.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import com.example.backend.chat.dto.ChatMessage;
import com.example.backend.chat.service.ChatService;
import com.example.backend.common.security.authentication.jwt.JwtUserInfo;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import java.util.Map;

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
                                   ChatMessage message,
                                   SimpMessageHeaderAccessor headerAccessor) {

        log.info("=== 메시지 전송 요청 수신 ===");
        log.info("방ID: {}, 메시지: {}", roomId, message.getContent());
        ChatMessage result = chatService.sendMessage(roomId, message, headerAccessor);
        log.info("=== 메시지 전송 완료 ===");
        return result;
    }

    /**
     * 방 입장
     */
    @MessageMapping("/chat.joinRoom/{roomId}")
    @SendTo("/topic/room.{roomId}")
    public ChatMessage joinRoom(@DestinationVariable String roomId,
                                SimpMessageHeaderAccessor headerAccessor) {

        log.info("=== 방 입장 요청 수신 ===");
        log.info("방ID: {}", roomId);
        ChatMessage result = chatService.joinRoom(roomId, headerAccessor);
        log.info("=== 방 입장 완료 ===");
        return result;
    }

    /**
     * 방 나가기
     */
    @MessageMapping("/chat.leaveRoom/{roomId}")
    @SendTo("/topic/room.{roomId}")
    public ChatMessage leaveRoom(@DestinationVariable String roomId,
                                 SimpMessageHeaderAccessor headerAccessor) {

        return chatService.leaveRoom(roomId, headerAccessor);
    }






    /**
     * 에러 처리 유틸리티
     */
    @MessageExceptionHandler
    @SendToUser("/queue/errors")
    public ChatMessage handleException(Exception exception, SimpMessageHeaderAccessor headerAccessor) {

        return chatService.createErrorMessage(headerAccessor, exception);
    }
}