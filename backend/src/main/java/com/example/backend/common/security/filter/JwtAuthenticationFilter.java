package com.example.backend.common.security.filter;

import com.example.backend.common.security.authentication.jwt.JwtUserInfo;
import com.example.backend.common.security.authentication.jwt.JwtUtil;
import com.example.backend.common.security.authentication.jwt.service.RefreshTokenService;
import com.example.backend.common.security.exception.JwtAuthenticationExceptionHandler;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.MissingClaimException;
import io.jsonwebtoken.security.SignatureException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import static com.example.backend.common.security.config.SecurityPaths.PUBLIC_GET_PATHS;
import static com.example.backend.common.security.config.SecurityPaths.PUBLIC_PATHS;

/**
 * JWT 기반 인증을 처리하는 필터 클래스 (디버깅 로그 강화)
 *
 * HTTP 요청의 쿠키에서 JWT 토큰을 추출하고 검증하여
 * Spring Security의 SecurityContext에 인증 정보를 설정합니다.
 * OncePerRequestFilter를 상속하여 요청당 한 번만 실행됩니다.
 */
@Slf4j
@RequiredArgsConstructor
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String JWT_COOKIE_NAME = "accessToken";
    private static final AntPathMatcher pathMatcher = new AntPathMatcher();

    private final JwtUtil jwtUtil;
    private final RefreshTokenService refreshTokenService;
    private final JwtAuthenticationExceptionHandler exceptionHandler;

    /**
     * 각 HTTP 요청에 대해 JWT 인증을 처리하는 메인 메서드 (디버깅 강화)
     * 쿠키에서 JWT 토큰을 추출하고 검증하여 인증 정보를 설정합니다.
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String requestURI = request.getRequestURI();
        String method = request.getMethod();

        System.out.println("🔍 JWT 필터 진입: " + method + " " + requestURI);
        System.out.println("🔍 요청 헤더 확인:");
        System.out.println("  - User-Agent: " + request.getHeader("User-Agent"));
        System.out.println("  - Content-Type: " + request.getHeader("Content-Type"));

        // 쿠키 정보 출력
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            System.out.println("🍪 쿠키 정보:");
            for (Cookie cookie : cookies) {
                if ("accessToken".equals(cookie.getName())) {
                    System.out.println("  - " + cookie.getName() + ": " +
                            (cookie.getValue().length() > 20 ?
                                    cookie.getValue().substring(0, 20) + "... (길이: " + cookie.getValue().length() + ")" :
                                    cookie.getValue()));
                } else {
                    System.out.println("  - " + cookie.getName() + ": " + cookie.getValue());
                }
            }
        } else {
            System.out.println("🍪 쿠키 없음");
        }

        try {
            String token = extractTokenFromCookie(request);
            System.out.println("🔐 쿠키에서 토큰 추출: " + (token != null ? "있음 (길이: " + token.length() + ")" : "없음"));

            if (!StringUtils.hasText(token)) {
                System.out.println("🚨 토큰 없음 - 401 에러 응답 준비");
                System.out.println("🚨 응답 상태: " + response.getStatus());
                exceptionHandler.handleAccessTokenMissing(response, request.getRequestURI());
                System.out.println("🚨 401 에러 응답 완료 - 필터 체인 중단");
                return;
            }

            System.out.println("✅ 토큰 검증 시작");
            Claims tokenClaims = jwtUtil.extractClaims(token);
            System.out.println("✅ 토큰 클레임 추출 성공");
            System.out.println("  - subject: " + tokenClaims.getSubject());
            System.out.println("  - user_id: " + tokenClaims.get("user_id"));
            System.out.println("  - token_type: " + tokenClaims.get("token_type"));

            if (!validateAccessToken(tokenClaims, response)) {
                System.out.println("❌ ACCESS 토큰 검증 실패");
                return;
            }

            // RTR 보안: 리프레시 토큰을 액세스 토큰으로 잘못 사용하는 경우 감지
            if (isRefreshTokenMisused(tokenClaims, response)) {
                System.out.println("❌ 리프레시 토큰 오남용 감지");
                return;
            }

            System.out.println("✅ 토큰 검증 완료 - 사용자 정보 생성");
            JwtUserInfo userInfo = jwtUtil.createJwtUserInfo(tokenClaims);

            UsernamePasswordAuthenticationToken authentication = createAuthentication(userInfo);
            SecurityContextHolder.getContext().setAuthentication(authentication);

            System.out.println("✅ 인증 성공 - SecurityContext 설정 완료");
            System.out.println("  - Principal: " + authentication.getPrincipal());
            System.out.println("  - Name: " + authentication.getName());

        } catch (MissingClaimException e) {
            System.out.println("🚨 JWT 클레임 누락: " + e.getClaimName());
            exceptionHandler.handleAccessTokenMissingRequiredClaim(response, e.getClaimName());
            return;
        } catch (ExpiredJwtException e) {
            System.out.println("🚨 JWT 만료: " + e.getMessage());
            exceptionHandler.handleAccessTokenExpired(response, e.getMessage());
            return;
        } catch (SignatureException e) {
            System.out.println("🚨 JWT 서명 오류: " + e.getMessage());
            exceptionHandler.handleAccessTokenInvalidSignature(response, e.getMessage());
            return;
        } catch (MalformedJwtException e) {
            System.out.println("🚨 JWT 형식 오류: " + e.getMessage());
            exceptionHandler.handleAccessTokenMalformed(response, e.getMessage());
            return;
        } catch (JwtException e) {
            System.out.println("🚨 JWT 일반 오류: " + e.getMessage());
            exceptionHandler.handleAccessTokenInvalid(response, e.getMessage());
            return;
        } catch (Exception e) {
            System.out.println("🚨 예상치 못한 오류: " + e.getMessage());
            e.printStackTrace();
            exceptionHandler.handleUnexpectedError(response, e);
            return;
        }

        System.out.println("✅ JWT 필터 완료 - 다음 필터로 진행");
        filterChain.doFilter(request, response);
    }

    /**
     * JWT 인증 필터를 건너뛸 요청 경로 판단 (디버깅 강화)
     * 특정 공개 API 엔드포인트에 대해서는 JWT 인증을 수행하지 않습니다.
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        String method = request.getMethod();

        System.out.println("🤔 필터 건너뛰기 검사: " + method + " " + path);

        if ("OPTIONS".equals(method)) {
            System.out.println("✅ OPTIONS 요청 - 필터 건너뛰기");
            return true;
        }

        boolean isPublicPath = Arrays.stream(PUBLIC_PATHS)
                .anyMatch(pattern -> {
                    boolean matches = pathMatcher.match(pattern, path);
                    if (matches) {
                        System.out.println("✅ PUBLIC_PATHS 매치: " + pattern + " -> " + path);
                    }
                    return matches;
                });

        boolean isPublicGetPath = "GET".equals(method) && Arrays.stream(PUBLIC_GET_PATHS)
                .anyMatch(pattern -> {
                    boolean matches = pathMatcher.match(pattern, path);
                    if (matches) {
                        System.out.println("✅ PUBLIC_GET_PATHS 매치: " + pattern + " -> " + path);
                    }
                    return matches;
                });

        boolean shouldSkip = isPublicPath || isPublicGetPath;
        System.out.println("🎯 필터 건너뛰기 결정: " + (shouldSkip ? "YES" : "NO"));

        return shouldSkip;
    }

    /**
     * JWT 사용자 정보를 기반으로 Spring Security Authentication 객체 생성
     */
    private UsernamePasswordAuthenticationToken createAuthentication(JwtUserInfo userInfo) {
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                userInfo,
                null,
                Collections.emptyList()
        );

        Map<String, Object> details = new HashMap<>();
        details.put("user_id", userInfo.userId());
        details.put("oauth2_provider", userInfo.oauth2Provider());
        details.put("oauth2_provider_id", userInfo.oauth2ProviderId());
        authentication.setDetails(details);

        return authentication;
    }
    @Override
    protected boolean shouldNotFilterAsyncDispatch() {
        return false;  // ASYNC 디스패치에서도 JWT 필터 실행
    }

    @Override
    protected boolean shouldNotFilterErrorDispatch() {
        return false;  // ERROR 디스패치에서도 JWT 필터 실행
    }


    /**
     * HTTP 요청의 쿠키에서 JWT 토큰을 추출
     */
    private String extractTokenFromCookie(HttpServletRequest request) {
        if (request.getCookies() == null) {
            return null;
        }

        return Arrays.stream(request.getCookies())
                .filter(cookie -> JWT_COOKIE_NAME.equals(cookie.getName()))
                .findFirst()
                .map(Cookie::getValue)
                .orElse(null);
    }

    /**
     * JWT 토큰의 타입이 ACCESS 토큰인지 검증
     */
    private boolean validateAccessToken(Claims tokenClaims, HttpServletResponse response) throws IOException {
        String tokenType = tokenClaims.get("token_type", String.class);

        if ("ACCESS".equals(tokenType)) {
            return true;
        }

        exceptionHandler.handleAccessTokenMisused(response, "ACCESS 토큰이 아닙니다: " + tokenType);
        return false;
    }

    /**
     * RTR 보안: 리프레시 토큰의 잘못된 사용 감지
     */
    private boolean isRefreshTokenMisused(Claims tokenClaims, HttpServletResponse response) throws IOException {
        String tokenType = tokenClaims.get("token_type", String.class);

        // 리프레시 토큰이 액세스 토큰으로 사용되는 경우
        if ("REFRESH".equals(tokenType)) {
            String userId = tokenClaims.get("user_id", String.class);

            // 보안 로그 기록
            log.error("RTR 보안 위반: 리프레시 토큰이 액세스 토큰으로 잘못 사용됨. userId: {}", userId);

            // 해당 사용자의 모든 리프레시 토큰 무효화 (보안 조치)
            if (userId != null) {
                try {
                    refreshTokenService.deleteRefreshToken(userId);
                    log.info("보안 위반으로 인한 사용자 모든 토큰 무효화 완료. userId: {}", userId);
                } catch (Exception e) {
                    log.error("보안 위반 처리 중 오류 발생. userId: {}, error: {}", userId, e.getMessage());
                }
            }

            exceptionHandler.handleRefreshTokenMisused(response, "리프레시 토큰을 액세스 토큰으로 사용할 수 없습니다.");
            return true;
        }

        return false;
    }
}
