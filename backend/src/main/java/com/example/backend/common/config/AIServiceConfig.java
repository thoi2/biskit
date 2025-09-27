package com.example.backend.common.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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
}
