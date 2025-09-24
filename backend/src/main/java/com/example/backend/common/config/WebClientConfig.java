package com.example.backend.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * WebClient 및 RestTemplate 설정 클래스
 * OAuth2 제공자와의 HTTP 통신을 위한 WebClient Bean과
 * AI API 호출을 위한 RestTemplate Bean을 정의합니다.
 */
@Configuration
public class WebClientConfig {

    /**
     * OAuth2 제공자와의 HTTP 통신을 위한 WebClient Bean
     *
     * @return 설정된 WebClient 인스턴스
     */
    @Bean
    public WebClient webClient() {
        return WebClient.builder()
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(1024 * 1024)) // 1MB
                .build();
    }

    /**
     * 🎯 AI API 호출을 위한 RestTemplate Bean 추가
     * @Async와 함께 사용하여 Spring Security와 완벽 호환
     *
     * @return 타임아웃이 설정된 RestTemplate 인스턴스
     */
    @Bean
    public RestTemplate restTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();

        // AI API는 응답 시간이 길 수 있으므로 넉넉한 타임아웃 설정
        factory.setConnectTimeout(30000);  // 30초 연결 타임아웃
        factory.setReadTimeout(120000);    // 2분 읽기 타임아웃 (AI 응답 대기)

        return new RestTemplate(factory);
    }
}
