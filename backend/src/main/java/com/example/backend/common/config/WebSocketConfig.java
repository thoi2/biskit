package com.example.backend.common.config;

import com.example.backend.chat.interceptor.AuthChannelInterceptor;
import com.example.backend.chat.interceptor.LoggingChannelInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketTransportRegistration;

@Configuration
@EnableWebSocketMessageBroker
@EnableAsync
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final AuthChannelInterceptor authChannelInterceptor;
    private final LoggingChannelInterceptor loggingChannelInterceptor;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Simple Broker 활성화 (메모리 기반)
        config.enableSimpleBroker("/topic", "/queue", "/user");

        // 클라이언트 → 서버 메시지 prefix
        config.setApplicationDestinationPrefixes("/app");

        // 사용자 특정 메시지 prefix
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // STOMP 엔드포인트 등록
        registry.addEndpoint("/ws")
            .setAllowedOriginPatterns("*") // CORS 설정 (패턴 사용)
            .withSockJS(); // 브라우저 호환성을 위한 폴백
    }

    @Override
    public void configureWebSocketTransport(WebSocketTransportRegistration registration) {
        // 메시지 크기 제한 (4 * 8192 = 32KB)
        registration.setMessageSizeLimit(4 * 8192);

        // 전송 시간 제한 (10초)
        registration.setSendTimeLimit(10000);

        // 전송 버퍼 크기 (1.5MB)
        registration.setSendBufferSizeLimit(3 * 512 * 1024);
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // 인터셉터 등록 (순서 중요)
        registration.interceptors(
            authChannelInterceptor,    // 1. 인증 먼저
            loggingChannelInterceptor  // 2. 로깅
        );

        // 스레드 풀 설정
        registration.taskExecutor()
            .corePoolSize(4)        // 기본 스레드 수
            .maxPoolSize(8)         // 최대 스레드 수
            .keepAliveSeconds(60);  // 유휴 스레드 유지 시간
    }

    @Override
    public void configureClientOutboundChannel(ChannelRegistration registration) {
        // 아웃바운드 채널 설정
        registration.taskExecutor()
            .corePoolSize(4)
            .maxPoolSize(8);
    }
}
