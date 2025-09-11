package com.example.backend.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * WebClient 설정 클래스
 * OAuth2 제공자와의 HTTP 통신을 위한 WebClient Bean을 정의합니다.
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
}