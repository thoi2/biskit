package com.example.backend.chat.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.annotation.EnableAsync;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

@Configuration
@EnableAsync
@Slf4j
public class AsyncConfig implements AsyncConfigurer {

    /**
     * 채팅 메시지 비동기 처리용 가상스레드 Executor
     */
    @Bean(name = "chatAsyncExecutor")
    public Executor chatAsyncExecutor() {
        log.info("가상스레드 기반 채팅 Executor 초기화");
        return Executors.newVirtualThreadPerTaskExecutor();
    }
}
