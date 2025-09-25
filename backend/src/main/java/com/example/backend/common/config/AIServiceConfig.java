package com.example.backend.common.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
@Slf4j
public class AIServiceConfig {
    
    @Value("${ai.gms.api-key}")
    private String gmsApiKey;
    
    @Value("${ai.gms.base-url}")
    private String gmsBaseUrl;
    
    @Bean
    public WebClient aiWebClient() {
        return WebClient.builder()
                .baseUrl(gmsBaseUrl)
                .defaultHeader("Authorization", "Bearer " + gmsApiKey)
                .defaultHeader("Content-Type", "application/json")
                .build();
    }
    @Bean
    public RestTemplate restTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();

        // AI API는 응답 시간이 길 수 있으므로 넉넉한 타임아웃 설정
        factory.setConnectTimeout(30000);  // 30초 연결 타임아웃
        factory.setReadTimeout(120000);    // 2분 읽기 타임아웃 (AI 응답 대기)

        return new RestTemplate(factory);
    }

}
