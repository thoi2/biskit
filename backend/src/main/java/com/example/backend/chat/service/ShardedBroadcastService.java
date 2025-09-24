package com.example.backend.chat.service;

import com.example.backend.chat.dto.ChatMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

/**
 * 샤드 기반 메시지 브로드캐스트 서비스
 * 가상스레드와 샤딩을 결합하여 대규모 브로드캐스트 성능 최적화
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ShardedBroadcastService {

    private final ShardManager shardManager;

    @Qualifier("chatAsyncExecutor")
    private final Executor chatAsyncExecutor;

    /**
     * 샤드별로 메시지 브로드캐스트 (병렬 처리)
     */
    public CompletableFuture<Void> broadcastToAllShards(String roomId, ChatMessage message) {
        Map<Integer, List<String>> roomShards = shardManager.getRoomShards(roomId);

        if (roomShards.isEmpty()) {
            log.warn("브로드캐스트할 샤드가 없음 - Room: {}", roomId);
            return CompletableFuture.completedFuture(null);
        }

        log.debug("샤드별 브로드캐스트 시작 - Room: {}, 샤드 수: {}", roomId, roomShards.size());

        // 각 샤드별로 병렬 브로드캐스트
        List<CompletableFuture<Void>> shardFutures = roomShards.entrySet()
                .stream()
                .map(entry -> broadcastToShard(roomId, entry.getKey(), entry.getValue(), message))
                .toList();

        // 모든 샤드 브로드캐스트 완료 대기
        return CompletableFuture.allOf(shardFutures.toArray(new CompletableFuture[0]))
                .whenComplete((result, throwable) -> {
                    if (throwable != null) {
                        log.error("샤드 브로드캐스트 중 오류 발생 - Room: {}", roomId, throwable);
                    } else {
                        log.debug("모든 샤드 브로드캐스트 완료 - Room: {}", roomId);
                    }
                });
    }

    /**
     * 특정 샤드에 메시지 브로드캐스트
     */
    private CompletableFuture<Void> broadcastToShard(String roomId, int shardId,
                                                    List<String> userIds, ChatMessage message) {
        return CompletableFuture.runAsync(() -> {
            try {
                log.debug("샤드 브로드캐스트 시작 - Room: {}, Shard: {}, 사용자 수: {}",
                    roomId, shardId, userIds.size());

                long startTime = System.currentTimeMillis();

                // 샤드 내 각 사용자에게 메시지 전송 (실제로는 WebSocket이나 SSE로 전송)
                for (String userId : userIds) {
                    // 실제 구현에서는 WebSocket 세션이나 SSE 연결로 메시지 전송
                    // 여기서는 시뮬레이션을 위해 작은 지연을 추가
                    simulateMessageDelivery(userId, message);
                }

                long duration = System.currentTimeMillis() - startTime;
                log.debug("샤드 브로드캐스트 완료 - Room: {}, Shard: {}, 소요시간: {}ms",
                    roomId, shardId, duration);

            } catch (Exception e) {
                log.error("샤드 브로드캐스트 실패 - Room: {}, Shard: {}", roomId, shardId, e);
                throw e;
            }
        }, chatAsyncExecutor);
    }

    /**
     * 메시지 전송 시뮬레이션 (실제로는 WebSocket/SSE 전송)
     */
    private void simulateMessageDelivery(String userId, ChatMessage message) {
        try {
            // 실제 네트워크 전송 시뮬레이션 (1-2ms)
            Thread.sleep(1 + (int) (Math.random() * 2));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("메시지 전송 중단 - User: {}", userId);
        }
    }

    /**
     * 브로드캐스트 성능 측정
     */
    public CompletableFuture<BroadcastStats> broadcastWithStats(String roomId, ChatMessage message) {
        long startTime = System.currentTimeMillis();

        return broadcastToAllShards(roomId, message)
                .thenApply(result -> {
                    long duration = System.currentTimeMillis() - startTime;
                    Map<Integer, Integer> shardStats = shardManager.getShardStatistics(roomId);
                    int totalUsers = shardManager.getTotalUsers(roomId);

                    return new BroadcastStats(
                        roomId,
                        totalUsers,
                        shardStats.size(),
                        duration,
                        shardStats
                    );
                });
    }

    /**
     * 브로드캐스트 통계 정보
     */
    public record BroadcastStats(
        String roomId,
        int totalUsers,
        int shardCount,
        long durationMs,
        Map<Integer, Integer> shardDistribution
    ) {}
}