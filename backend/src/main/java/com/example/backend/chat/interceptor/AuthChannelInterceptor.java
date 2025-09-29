package com.example.backend.chat.interceptor;

import com.example.backend.common.security.authentication.jwt.JwtUserInfo;
import com.example.backend.common.security.authentication.jwt.JwtUtil;
import com.example.backend.common.exception.BusinessException;
import com.example.backend.common.exception.ErrorCode;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.MissingClaimException;
import io.jsonwebtoken.security.SignatureException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.security.Principal;
import java.util.Arrays;
import java.util.Map;

/**
 * 인증 및 권한 체크 인터셉터
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class AuthChannelInterceptor implements ChannelInterceptor {

    private static final String JWT_COOKIE_NAME = "accessToken";
    private final JwtUtil jwtUtil;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        log.info("=== AuthChannelInterceptor: preSend 호출됨 ===");

        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null) {
            log.info("AuthChannelInterceptor - 명령어: {}", accessor.getCommand());

            if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
                log.info("AuthChannelInterceptor - SUBSCRIBE 처리");
                handleSubscribe(accessor);
            } else if (StompCommand.SEND.equals(accessor.getCommand())) {
                log.info("AuthChannelInterceptor - SEND 처리");
                handleSend(accessor);
            }
        } else {
            log.info("AuthChannelInterceptor - accessor가 null");
        }

        return message;
    }

    private void handleSubscribe(StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();
        Principal user = accessor.getUser();

        if (user == null) {
            throw new BusinessException(ErrorCode.CHAT_USER_NOT_AUTHENTICATED);
        }

        // 개인 큐 구독 권한 체크 (세션에서 JwtUserInfo 가져오기)
        if (destination != null && destination.startsWith("/user/")) {
            Principal principal = accessor.getUser();
            JwtUserInfo userInfo = null;
            if (user instanceof UsernamePasswordAuthenticationToken) {
                UsernamePasswordAuthenticationToken auth = (UsernamePasswordAuthenticationToken) principal;
                userInfo = (JwtUserInfo) auth.getPrincipal();
                // userInfo 사용
            }
            if (userInfo != null) {
                String userId = userInfo.userId();
                if (!destination.contains("/" + userId + "/")) {
                    log.warn("권한 없는 개인 큐 구독 시도: {} by userId: {}", destination, userId);
                    throw new BusinessException(ErrorCode.CHAT_USER_NOT_AUTHENTICATED);
                }
            }
        }

        String userIdentifier = user != null ? user.getName() : "Anonymous";
        log.debug("구독 허용: {} by {}", destination, userIdentifier);
    }

    private void handleSend(StompHeaderAccessor accessor) {
        Principal user = accessor.getUser();
        if (user == null) {
            throw new BusinessException(ErrorCode.CHAT_USER_NOT_AUTHENTICATED);
        }

        // 추가 권한 체크 로직...
        String userIdentifier = user != null ? user.getName() : "Anonymous";
        log.debug("메시지 전송 허용: {}", userIdentifier);
    }

    /**
     * WebSocket 헤더에서 쿠키를 추출하여 JWT 토큰을 가져옴
     */
    private String extractTokenFromCookies(StompHeaderAccessor accessor) {
        // 주요 헤더들 확인
        log.info("=== 헤더 확인 ===");
        log.info("Session ID: {}", accessor.getSessionId());
        log.info("User: {}", accessor.getUser());
        log.info("Message Type: {}", accessor.getMessageType());

        // 다양한 쿠키 헤더명 시도
        String[] cookieHeaderNames = {"cookie", "Cookie", "cookies", "Cookies"};
        for (String headerName : cookieHeaderNames) {
            String headerValue = accessor.getFirstNativeHeader(headerName);
            if (headerValue != null) {
                log.info("Found header {}: {}", headerName, headerValue);
            }
        }

        // STOMP 연결시 쿠키는 'cookie' 헤더에 전달됨
        String cookieHeader = accessor.getFirstNativeHeader("cookie");

        log.info("=== 쿠키 헤더 확인 ===");
        log.info("Cookie Header: {}", cookieHeader);

        if (!StringUtils.hasText(cookieHeader)) {
            log.warn("Cookie 헤더가 비어있음");
            return null;
        }

        // 쿠키 파싱하여 accessToken 찾기
        String token = Arrays.stream(cookieHeader.split(";"))
            .map(String::trim)
            .peek(cookie -> log.info("Cookie: {}", cookie))
            .filter(cookie -> cookie.startsWith(JWT_COOKIE_NAME + "="))
            .findFirst()
            .map(cookie -> {
                String tokenValue = cookie.substring(JWT_COOKIE_NAME.length() + 1);
                log.info("추출된 토큰: {}", tokenValue.substring(0, Math.min(50, tokenValue.length())) + "...");
                return tokenValue;
            })
            .orElse(null);

        if (token == null) {
            log.warn("accessToken 쿠키를 찾을 수 없음");
        }

        return token;
    }

    /**
     * STOMP 헤더에서 Authorization 헤더를 추출하여 JWT 토큰을 가져옴
     */
    private String extractTokenFromAuthHeader(StompHeaderAccessor accessor) {
        String authHeader = accessor.getFirstNativeHeader("Authorization");

        log.info("=== Authorization 헤더 확인 ===");
        log.info("Authorization Header: {}", authHeader);

        if (!StringUtils.hasText(authHeader)) {
            log.warn("Authorization 헤더가 비어있음");
            return null;
        }

        if (authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            log.info("추출된 토큰: {}", token.substring(0, Math.min(50, token.length())) + "...");
            return token;
        } else {
            log.warn("Authorization 헤더가 Bearer 형식이 아님: {}", authHeader);
            return null;
        }
    }

}


