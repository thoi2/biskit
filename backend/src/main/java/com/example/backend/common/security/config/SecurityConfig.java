package com.example.backend.common.security.config;

import com.example.backend.common.security.filter.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.Arrays;
import org.springframework.security.web.context.RequestAttributeSecurityContextRepository;
/**
 * JWT 쿠키 기반 Security 설정 (CSRF 토큰 없음)
 * SameSite 쿠키와 Origin 검증으로 CSRF 보호
 * Reactive(Mono/Flux) 응답 지원 추가
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Value("${app.cors.allowed-origins}")
    private String[] allowedOrigins;

    @Value("${app.cors.max-age-seconds:3600}")
    private long corsMaxAgeSeconds;

    /**
     * Spring Security 필터 체인 설정 (Reactive 지원 강화)
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // ⬇️ 여기 추가 (STATLESS + 비동기 친화 저장소)
                .securityContext(sc -> sc
                        .securityContextRepository(
                                new RequestAttributeSecurityContextRepository()
                        )
                )

                .requestCache(cache -> cache.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(SecurityPaths.PUBLIC_PATHS).permitAll()
                        .requestMatchers(SecurityPaths.rc_PATHS).permitAll()
                        .requestMatchers("/error", "/favicon.ico").permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((req, res, ex) -> {
                            res.setStatus(401);
                            res.setContentType("application/json;charset=UTF-8");
                            res.getWriter().write("{\"status\":401,\"error\":\"Unauthorized\",\"message\":\"인증이 필요합니다\"}");
                        })
                        .accessDeniedHandler((req, res, ex) -> {
                            res.setStatus(403);
                            res.setContentType("application/json;charset=UTF-8");
                            res.getWriter().write("{\"status\":403,\"error\":\"Forbidden\",\"message\":\"접근 권한이 없습니다\"}");
                        })
                )
                .headers(headers -> headers
                        .frameOptions(f -> f.sameOrigin())
                        .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; script-src 'self' 'unsafe-inline'")))
                .build();
    }


    /**
     * CORS 설정 (쿠키 전송을 위해 credentials 허용)
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // 허용된 도메인 설정
        configuration.setAllowedOriginPatterns(Arrays.asList(allowedOrigins));

        // 허용된 HTTP 메서드
        configuration.setAllowedMethods(Arrays.asList(
                "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

        // 허용된 헤더 (CSRF 토큰 관련 헤더 제거)
        configuration.setAllowedHeaders(Arrays.asList(
                "Content-Type",
                "Accept",
                "Origin",
                "X-Requested-With"));

        // 인증 정보 포함 허용 (쿠키 전송을 위해 필수)
        configuration.setAllowCredentials(true);

        // preflight 요청 캐시 시간
        configuration.setMaxAge(corsMaxAgeSeconds);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
