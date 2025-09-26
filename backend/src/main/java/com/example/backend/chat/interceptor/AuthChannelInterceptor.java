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

            if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                log.info("AuthChannelInterceptor - CONNECT 처리");
                handleConnect(accessor);
            } else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
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

    private void handleConnect(StompHeaderAccessor accessor) {
        // 💡 1. WebSocket 세션에서 이미 인증된 Principal (사용자 정보)을 확인
        //    이 Principal은 Spring Security가 HTTP 요청 단계에서 설정했을 가능성이 높습니다.
        Principal principal = accessor.getUser(); 

        if (principal != null && StringUtils.hasText(principal.getName())) {
            // 💡 2. Principal이 존재하면, 이미 인증된 상태이므로 토큰 검증 로직을 모두 건너뛰고 연결을 허용합니다.
            //    이 정보는 HTTP 세션에서 넘어왔거나, 이전 JWT 필터에서 SecurityContext에 주입된 것입니다.
            
            // (선택적) 로그만 남기고 정상 종료
            log.info("WebSocket 연결 허용: 이미 인증된 Principal 발견. User: {}", principal.getName());
            
            // 💡 주의: 기존에 Principal 외에 JwtUserInfo 객체를 세션에 넣는 로직이 있었다면
            //         여기서 다시 확인하고 주입해야 합니다. (아래 주석 참고)
            
            // 💡 (만약 필요하다면) 여기서 Principal 정보를 기반으로 JwtUserInfo를 다시 세션에 넣어줍니다.
            //     예시: if (accessor.getSessionAttributes().get("jwtUserInfo") == null) { ... }
            
            return; 
        }

        // --------------------------------------------------------------------
        // 3. Principal이 없는 경우: 토큰 추출 및 검증 로직 실행 (기존 로직)
        //    이 부분은 Principal을 찾지 못했을 때 '최후의 수단'으로 토큰을 재검증합니다.
        //    (원래 HTTP 인증이 실패했거나, 인증 정보가 전달되지 않았을 때만 실행되어야 합니다.)

        try {
            // ⚠️ 주의: 이 아래 로직은 Principal을 찾지 못했을 때만 실행되어야 합니다!
            
            // 쿠키에서 JWT 토큰 추출 시도
            String token = extractTokenFromCookies(accessor);

            // 쿠키에서 토큰을 찾을 수 없으면 Authorization 헤더에서 추출 시도
            if (!StringUtils.hasText(token)) {
                token = extractTokenFromAuthHeader(accessor);
            }

            if (!StringUtils.hasText(token)) {
                log.warn("WebSocket 연결 시도: JWT 토큰이 없음 (Principal과 토큰 헤더 모두 확인 실패)");
                // 💡 Principal이 없으면 토큰을 강제 요구
                throw new BusinessException(ErrorCode.AUTH_TOKEN_MISSING);
            }

            // (이하 기존 JWT 검증 및 사용자 정보 추출/주입 로직은 그대로 유지)
            // ... 토큰 검증 로직 ...
            Claims tokenClaims = jwtUtil.extractClaims(token);

            // ... 타입 확인 ...
            String tokenType = tokenClaims.get("token_type", String.class);
            if (!"ACCESS".equals(tokenType)) {
                 throw new BusinessException(ErrorCode.AUTH_ACCESS_TOKEN_MISUSED);
            }

            JwtUserInfo userInfo = jwtUtil.createJwtUserInfo(tokenClaims);

            // 주입 로직
            accessor.setUser(() -> userInfo.username());
            accessor.getSessionAttributes().put("jwtUserInfo", userInfo);

            log.info("WebSocket 사용자 인증 성공: {} (userId: {})", userInfo.username(), userInfo.userId());

        } catch (BusinessException e) {
             // ... 기존 비즈니스 예외 처리 ...
             log.warn("WebSocket 연결 실패: 비즈니스 예외", e.getMessage());
             throw e;
        } catch (Exception e) {
             // ... 기타 JWT 및 예상치 못한 예외 처리 ...
             log.error("WebSocket 연결 실패: 예상치 못한 오류", e);
             throw new BusinessException(ErrorCode.COMMON_INTERNAL_SERVER_ERROR, e);
        }
    }

    private void handleSubscribe(StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();
        Principal user = accessor.getUser();

        if (user == null) {
            throw new BusinessException(ErrorCode.CHAT_USER_NOT_AUTHENTICATED);
        }

        // 개인 큐 구독 권한 체크 (세션에서 JwtUserInfo 가져오기)
        if (destination != null && destination.startsWith("/user/")) {
            JwtUserInfo userInfo = (JwtUserInfo) accessor.getSessionAttributes().get("jwtUserInfo");
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


