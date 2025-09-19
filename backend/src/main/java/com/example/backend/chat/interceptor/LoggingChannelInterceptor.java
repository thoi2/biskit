package com.example.backend.chat.interceptor;

import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

/**
 * 로깅 인터셉터
 */
@Component
@Slf4j
public  class LoggingChannelInterceptor implements ChannelInterceptor {

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        log.info("=== LoggingChannelInterceptor: preSend 호출됨 ===");

        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null) {
            StompCommand command = accessor.getCommand();
            String username = accessor.getUser() != null ? accessor.getUser().getName() : "Anonymous";

            log.info("STOMP 명령어: {}, 사용자: {}", command, username);

            switch (command) {
                case CONNECT:
                    log.info("STOMP CONNECT - 사용자: {}", username);
                    break;
                case SUBSCRIBE:
                    log.info("STOMP SUBSCRIBE - 사용자: {}, 목적지: {}", username, accessor.getDestination());
                    break;
                case SEND:
                    log.info("STOMP SEND - 사용자: {}, 목적지: {}", username, accessor.getDestination());
                    break;
                case DISCONNECT:
                    log.info("STOMP DISCONNECT - 사용자: {}", username);
                    break;
                default:
                    log.info("STOMP 기타 명령어: {} - 사용자: {}", command, username);
                    break;
            }
        } else {
            log.info("StompHeaderAccessor가 null입니다.");
        }

        return message;
    }

    @Override
    public void afterSendCompletion(Message<?> message, MessageChannel channel, boolean sent, Exception ex) {
        if (!sent) {
            log.error("메시지 전송 실패: {}", ex != null ? ex.getMessage() : "알 수 없는 오류");
        }
    }
}
