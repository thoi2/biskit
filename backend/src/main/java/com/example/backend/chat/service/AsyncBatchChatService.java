package com.example.backend.chat.service;

import com.example.backend.chat.dto.ChatMessage;
import com.example.backend.chat.entity.ChatMessageEntity;
import com.example.backend.chat.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AsyncBatchChatService {

    private final ChatMessageRepository chatMessageRepository;

    // 메시지 배치 처리를 위한 큐
    private final BlockingQueue<ChatMessage> messageQueue = new LinkedBlockingQueue<>(10000);

    // 실패한 메시지를 위한 재시도 큐
    private final BlockingQueue<ChatMessage> retryQueue = new LinkedBlockingQueue<>(1000);

    // 배치 처리 스케줄러
    private ScheduledExecutorService batchScheduler;

    // 통계 정보
    private final AtomicLong totalProcessedMessages = new AtomicLong(0);
    private final AtomicLong totalFailedMessages = new AtomicLong(0);
    private final AtomicInteger currentQueueSize = new AtomicInteger(0);

    // 배치 설정
    private static final int DEFAULT_BATCH_SIZE = 50;
    private static final int MAX_BATCH_SIZE = 200;
    private static final int MIN_BATCH_SIZE = 10;
    private volatile int currentBatchSize = DEFAULT_BATCH_SIZE;

    @PostConstruct
    public void initBatchProcessor() {
        batchScheduler = Executors.newScheduledThreadPool(3, Thread.ofVirtual().factory());

        // 1. 메인 배치 처리 (500ms마다)
        batchScheduler.scheduleAtFixedRate(this::processBatch, 500, 500, TimeUnit.MILLISECONDS);

        // 2. 재시도 처리 (5초마다)
        batchScheduler.scheduleAtFixedRate(this::processRetryQueue, 5, 5, TimeUnit.SECONDS);

        // 3. 큐 모니터링 (10초마다)
        batchScheduler.scheduleAtFixedRate(this::monitorQueues, 10, 10, TimeUnit.SECONDS);

        log.info("AsyncBatchChatService 가상스레드 기반 초기화 완료");
    }

    @PreDestroy
    public void shutdownBatchProcessor() {
        if (batchScheduler != null) {
            batchScheduler.shutdown();
            try {
                if (!batchScheduler.awaitTermination(30, TimeUnit.SECONDS)) {
                    batchScheduler.shutdownNow();
                }
            } catch (InterruptedException e) {
                batchScheduler.shutdownNow();
            }
        }

        // 남은 메시지들 강제 처리
        processFinalBatch();
        log.info("AsyncBatchChatService 종료 완료");
    }

    /**
     * 비동기로 메시지를 배치 큐에 추가
     */
    @Async("chatAsyncExecutor")
    public void saveMessageAsync(ChatMessage message) {
        try {
            // 메시지 ID가 없으면 생성
            if (message.getId() == null) {
                message.setId(UUID.randomUUID().toString());
            }

            // 타임스탬프가 없으면 현재 시간으로 설정
            if (message.getTimestamp() == null) {
                message.setTimestamp(LocalDateTime.now());
            }

            // 큐에 추가 (논블로킹)
            boolean added = messageQueue.offer(message);

            if (!added) {
                log.warn("메시지 큐가 가득참 - 즉시 저장으로 폴백: {}", message.getId());
                saveMessageImmediately(message);
            } else {
                currentQueueSize.incrementAndGet();
                log.debug("메시지 큐에 추가됨: {} (큐 크기: {})", message.getId(), currentQueueSize.get());
            }

        } catch (Exception e) {
            log.error("비동기 메시지 처리 실패 - 즉시 저장으로 폴백", e);
            saveMessageImmediately(message);
        }
    }

    /**
     * 배치 처리 메인 로직
     */
    private void processBatch() {
        List<ChatMessage> batch = new ArrayList<>();

        // 큐에서 메시지들을 가져오기 (논블로킹)
        int batchSize = calculateOptimalBatchSize();
        messageQueue.drainTo(batch, batchSize);

        if (!batch.isEmpty()) {
            currentQueueSize.addAndGet(-batch.size());

            long startTime = System.currentTimeMillis();

            try {
                saveBatchToDatabase(batch);

                long duration = System.currentTimeMillis() - startTime;
                totalProcessedMessages.addAndGet(batch.size());

                // 배치 크기 동적 조정
                adjustBatchSize(duration, batch.size());

                log.debug("배치 저장 완료: {}개 메시지, {}ms 소요", batch.size(), duration);

            } catch (Exception e) {
                log.error("배치 저장 실패 - 재시도 큐에 추가: {}개 메시지", batch.size(), e);
                totalFailedMessages.addAndGet(batch.size());

                // 실패한 메시지들을 재시도 큐에 추가
                for (ChatMessage message : batch) {
                    if (!retryQueue.offer(message)) {
                        log.error("재시도 큐도 가득참 - 메시지 손실: {}", message.getId());
                    }
                }
            }
        }
    }

    /**
     * 재시도 큐 처리
     */
    private void processRetryQueue() {
        List<ChatMessage> retryBatch = new ArrayList<>();
        retryQueue.drainTo(retryBatch, 20); // 재시도는 작은 배치로

        if (!retryBatch.isEmpty()) {
            try {
                saveBatchToDatabase(retryBatch);
                totalProcessedMessages.addAndGet(retryBatch.size());
                log.info("재시도 배치 저장 성공: {}개 메시지", retryBatch.size());

            } catch (Exception e) {
                log.error("재시도 배치 저장도 실패 - 메시지 손실: {}개", retryBatch.size(), e);
                totalFailedMessages.addAndGet(retryBatch.size());
            }
        }
    }

    /**
     * 실제 DB 배치 저장
     */
    @Transactional
    public void saveBatchToDatabase(List<ChatMessage> messages) {
        if (messages.isEmpty()) {
            return;
        }

        List<ChatMessageEntity> entities = messages.stream()
            .map(this::convertToEntity)
            .collect(Collectors.toList());

        // JPA saveAll로 배치 INSERT
        chatMessageRepository.saveAll(entities);

        log.debug("DB 배치 저장 완료: {}개", entities.size());
    }

    /**
     * 즉시 저장 (폴백용)
     */
    private void saveMessageImmediately(ChatMessage message) {
        try {
            ChatMessageEntity entity = convertToEntity(message);
            chatMessageRepository.save(entity);
            totalProcessedMessages.incrementAndGet();
            log.debug("즉시 저장 완료: {}", message.getId());

        } catch (Exception e) {
            log.error("즉시 저장 실패: {}", message.getId(), e);
            totalFailedMessages.incrementAndGet();
        }
    }

    /**
     * 최적 배치 크기 계산
     */
    private int calculateOptimalBatchSize() {
        int queueSize = currentQueueSize.get();

        if (queueSize > 500) {
            return MAX_BATCH_SIZE; // 큐가 많이 밀렸으면 큰 배치
        } else if (queueSize > 100) {
            return Math.min(MAX_BATCH_SIZE, currentBatchSize + 20);
        } else if (queueSize > 20) {
            return currentBatchSize;
        } else {
            return Math.max(MIN_BATCH_SIZE, Math.min(queueSize, currentBatchSize));
        }
    }

    /**
     * 배치 크기 동적 조정
     */
    private void adjustBatchSize(long duration, int processedCount) {
        // 너무 오래 걸리면 배치 크기 줄이기
        if (duration > 2000) { // 2초 초과
            currentBatchSize = Math.max(MIN_BATCH_SIZE, currentBatchSize - 10);
            log.info("배치 크기 감소: {} (처리시간: {}ms)", currentBatchSize, duration);
        }
        // 빠르게 처리되고 큐에 메시지가 많으면 배치 크기 늘리기
        else if (duration < 500 && processedCount == currentBatchSize && currentQueueSize.get() > 50) {
            currentBatchSize = Math.min(MAX_BATCH_SIZE, currentBatchSize + 10);
            log.info("배치 크기 증가: {} (처리시간: {}ms)", currentBatchSize, duration);
        }
    }

    /**
     * 큐 모니터링
     */
    private void monitorQueues() {
        int mainQueueSize = currentQueueSize.get();
        int retryQueueSize = retryQueue.size();

        if (mainQueueSize > 0 || retryQueueSize > 0) {
            log.info("큐 상태 - 메인: {}개, 재시도: {}개, 처리완료: {}개, 실패: {}개",
                mainQueueSize, retryQueueSize,
                totalProcessedMessages.get(), totalFailedMessages.get());
        }

        // 큐가 너무 크면 경고
        if (mainQueueSize > 1000) {
            log.warn("메인 큐 크기 경고: {}개 - DB 성능 점검 필요", mainQueueSize);
        }

        if (retryQueueSize > 100) {
            log.warn("재시도 큐 크기 경고: {}개 - 시스템 오류 점검 필요", retryQueueSize);
        }
    }

    /**
     * 애플리케이션 종료시 남은 메시지 처리
     */
    private void processFinalBatch() {
        log.info("애플리케이션 종료 - 남은 메시지 처리 시작");

        // 메인 큐 처리
        List<ChatMessage> remainingMessages = new ArrayList<>();
        messageQueue.drainTo(remainingMessages);

        if (!remainingMessages.isEmpty()) {
            try {
                saveBatchToDatabase(remainingMessages);
                log.info("종료시 메인 큐 처리 완료: {}개", remainingMessages.size());
            } catch (Exception e) {
                log.error("종료시 메인 큐 처리 실패: {}개", remainingMessages.size(), e);
            }
        }

        // 재시도 큐 처리
        List<ChatMessage> retryMessages = new ArrayList<>();
        retryQueue.drainTo(retryMessages);

        if (!retryMessages.isEmpty()) {
            try {
                saveBatchToDatabase(retryMessages);
                log.info("종료시 재시도 큐 처리 완료: {}개", retryMessages.size());
            } catch (Exception e) {
                log.error("종료시 재시도 큐 처리 실패: {}개", retryMessages.size(), e);
            }
        }
    }

    /**
     * ChatMessage를 ChatMessageEntity로 변환
     */
    private ChatMessageEntity convertToEntity(ChatMessage message) {
        return ChatMessageEntity.builder()
            .messageId(message.getId())
            .roomId(message.getRoomId())
            .sender(message.getSender())
            .content(message.getContent())
            .messageType(message.getType())
            .createdAt(message.getTimestamp())
            .build();
    }

    /**
     * 통계 정보 조회
     */
    public Map<String, Object> getStatistics() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("mainQueueSize", currentQueueSize.get());
        stats.put("retryQueueSize", retryQueue.size());
        stats.put("totalProcessedMessages", totalProcessedMessages.get());
        stats.put("totalFailedMessages", totalFailedMessages.get());
        stats.put("currentBatchSize", currentBatchSize);
        stats.put("successRate", calculateSuccessRate());
        return stats;
    }

    private double calculateSuccessRate() {
        long total = totalProcessedMessages.get() + totalFailedMessages.get();
        if (total == 0) return 100.0;
        return (double) totalProcessedMessages.get() / total * 100.0;
    }

    /**
     * 큐 크기 조회 (모니터링용)
     */
    public int getMainQueueSize() {
        return currentQueueSize.get();
    }

    public int getRetryQueueSize() {
        return retryQueue.size();
    }
}