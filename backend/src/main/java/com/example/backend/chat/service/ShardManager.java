package com.example.backend.chat.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * 채팅 메시지 정적 샤딩 관리자
 * 항상 2개 샤드로 사용자를 분산하여 브로드캐스트 성능 최적화
 */
@Service
@Slf4j
public class ShardManager {

    private static final int SHARD_COUNT = 2; // 고정 2개 샤드
    private static final int USERS_PER_SHARD = 250; // 샤드당 최대 250명

    // roomId -> (shardId -> List<userId>)
    private final Map<String, Map<Integer, List<String>>> roomShards = new ConcurrentHashMap<>();

    /**
     * 사용자를 샤드에 할당
     */
    public int addUserToShard(String roomId, String userId) {
        // userId 해시를 기반으로 샤드 결정 (일관된 해싱)
        int shardId = Math.abs(userId.hashCode()) % SHARD_COUNT;

        roomShards.computeIfAbsent(roomId, k -> new ConcurrentHashMap<>())
                  .computeIfAbsent(shardId, k -> new java.util.concurrent.CopyOnWriteArrayList<>())
                  .add(userId);

        log.debug("사용자 샤드 할당 - Room: {}, User: {}, Shard: {}", roomId, userId, shardId);
        return shardId;
    }

    /**
     * 사용자를 샤드에서 제거
     */
    public void removeUserFromShard(String roomId, String userId) {
        Map<Integer, List<String>> shards = roomShards.get(roomId);
        if (shards == null) return;

        for (Map.Entry<Integer, List<String>> entry : shards.entrySet()) {
            if (entry.getValue().remove(userId)) {
                log.debug("사용자 샤드 제거 - Room: {}, User: {}, Shard: {}", roomId, userId, entry.getKey());
                break;
            }
        }

        // 빈 샤드 정리
        shards.entrySet().removeIf(entry -> entry.getValue().isEmpty());
        if (shards.isEmpty()) {
            roomShards.remove(roomId);
        }
    }

    /**
     * 특정 방의 모든 샤드 정보 조회
     */
    public Map<Integer, List<String>> getRoomShards(String roomId) {
        return roomShards.getOrDefault(roomId, Map.of());
    }

    /**
     * 특정 샤드의 사용자 목록 조회
     */
    public List<String> getShardUsers(String roomId, int shardId) {
        return roomShards.getOrDefault(roomId, Map.of())
                        .getOrDefault(shardId, List.of());
    }

    /**
     * 방의 전체 사용자 수 조회
     */
    public int getTotalUsers(String roomId) {
        return roomShards.getOrDefault(roomId, Map.of())
                        .values()
                        .stream()
                        .mapToInt(List::size)
                        .sum();
    }

    /**
     * 샤드별 사용자 수 통계
     */
    public Map<Integer, Integer> getShardStatistics(String roomId) {
        return roomShards.getOrDefault(roomId, Map.of())
                        .entrySet()
                        .stream()
                        .collect(Collectors.toMap(
                            Map.Entry::getKey,
                            entry -> entry.getValue().size()
                        ));
    }

    /**
     * 방의 모든 사용자 목록 (전체 샤드 합계)
     */
    public List<String> getAllUsers(String roomId) {
        return roomShards.getOrDefault(roomId, Map.of())
                        .values()
                        .stream()
                        .flatMap(List::stream)
                        .collect(Collectors.toList());
    }

    /**
     * 특정 사용자가 속한 샤드 ID 조회
     */
    public int getUserShard(String roomId, String userId) {
        Map<Integer, List<String>> shards = roomShards.get(roomId);
        if (shards == null) return -1;

        for (Map.Entry<Integer, List<String>> entry : shards.entrySet()) {
            if (entry.getValue().contains(userId)) {
                return entry.getKey();
            }
        }
        return -1;
    }

    /**
     * 방 정리 (방 삭제 시 호출)
     */
    public void clearRoom(String roomId) {
        Map<Integer, List<String>> removed = roomShards.remove(roomId);
        if (removed != null) {
            int totalUsers = removed.values().stream().mapToInt(List::size).sum();
            log.info("방 샤드 정리 완료 - Room: {}, 총 사용자: {}명, 샤드 수: {}",
                roomId, totalUsers, removed.size());
        }
    }

    /**
     * 샤드 밸런스 정보 로깅 (디버깅용)
     */
    public void logShardBalance(String roomId) {
        Map<Integer, Integer> stats = getShardStatistics(roomId);
        log.info("샤드 밸런스 - Room: {}, 통계: {}", roomId, stats);
    }
}