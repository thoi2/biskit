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
 * JWT 기반 인증을 처리하는 필터 클래스
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
     * 각 HTTP 요청에 대해 JWT 인증을 처리하는 메인 메서드
     * 쿠키에서 JWT 토큰을 추출하고 검증하여 인증 정보를 설정합니다.
     *
     * @param request HTTP 요청 객체
     * @param response HTTP 응답 객체
     * @param filterChain 필터 체인
     * @throws ServletException 서블릿 예외 발생 시
     * @throws IOException I/O 예외 발생 시
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
        throws ServletException, IOException {

        try {
            String token = extractTokenFromCookie(request);

            if (!StringUtils.hasText(token)) {
                exceptionHandler.handleAccessTokenMissing(response, request.getRequestURI());
                return;
            }

            Claims tokenClaims = jwtUtil.extractClaims(token);

            if (!validateAccessToken(tokenClaims, response)) {
                return;
            }

            // RTR 보안: 리프레시 토큰을 액세스 토큰으로 잘못 사용하는 경우 감지
            if (isRefreshTokenMisused(tokenClaims, response)) {
                return;
            }

            JwtUserInfo userInfo = jwtUtil.createJwtUserInfo(tokenClaims);

            UsernamePasswordAuthenticationToken authentication = createAuthentication(userInfo);
            SecurityContextHolder.getContext().setAuthentication(authentication);

        } catch (MissingClaimException e) {
            exceptionHandler.handleAccessTokenMissingRequiredClaim(response, e.getClaimName());
            return;
        } catch (ExpiredJwtException e) {
            exceptionHandler.handleAccessTokenExpired(response, e.getMessage());
            return;
        } catch (SignatureException e) {
            exceptionHandler.handleAccessTokenInvalidSignature(response, e.getMessage());
            return;
        } catch (MalformedJwtException e) {
            exceptionHandler.handleAccessTokenMalformed(response, e.getMessage());
            return;
        } catch (JwtException e) {
            exceptionHandler.handleAccessTokenInvalid(response, e.getMessage());
            return;
        } catch (Exception e) {
            exceptionHandler.handleUnexpectedError(response, e);
            return;
        }

        filterChain.doFilter(request, response);
    }

    /**
     * JWT 인증 필터를 건너뛸 요청 경로 판단
     * 특정 공개 API 엔드포인트에 대해서는 JWT 인증을 수행하지 않습니다.
     *
     * @param request HTTP 요청 객체
     * @return 필터를 건너뛸 경우 true, JWT 인증이 필요한 경우 false
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        String method = request.getMethod();

        if ("OPTIONS".equals(method)) {
            return true;
        }

        boolean isPublicPath = Arrays.stream(PUBLIC_PATHS)
            .anyMatch(pattern -> pathMatcher.match(pattern, path));
        boolean isPublicGetPath = "GET".equals(method) && Arrays.stream(PUBLIC_GET_PATHS)
            .anyMatch(pattern -> pathMatcher.match(pattern, path));

        return isPublicPath || isPublicGetPath;
    }

    /**
     * JWT 사용자 정보를 기반으로 Spring Security Authentication 객체 생성
     * 사용자 정보와 권한을 포함한 인증 토큰을 생성하고, OAuth2 관련 상세 정보를 설정합니다.
     *
     * @param userInfo JWT에서 추출된 사용자 정보
     * @return Spring Security에서 사용할 Authentication 객체
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
     * accessToken 이름의 쿠키에서 JWT 토큰 값을 가져옵니다.
     *
     * @param request HTTP 요청 객체
     * @return 추출된 JWT 토큰, 없으면 null
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
     * REFRESH 토큰이나 다른 타입의 토큰은 거부합니다.
     *
     * @param tokenClaims JWT 토큰에서 추출한 클레임
     * @param response HTTP 응답 객체
     * @return 검증 통과 시 true, 실패 시 false
     * @throws IOException 응답 작성 중 I/O 오류 발생 시
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
     * 리프레시 토큰이 액세스 토큰으로 잘못 사용되는 경우를 감지하고 보안 조치를 취합니다.
     *
     * @param tokenClaims JWT 토큰에서 추출한 클레임
     * @param response HTTP 응답 객체
     * @return 리프레시 토큰이 잘못 사용된 경우 true, 정상인 경우 false
     * @throws IOException 응답 작성 중 I/O 오류 발생 시
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
