package com.example.backend.chat.service;

import com.example.backend.chat.dto.ChatMessage;
import com.example.backend.chat.entity.ChatMessageEntity;
import com.example.backend.chat.repository.ChatMessageRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatCacheService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final ChatMessageRepository chatMessageRepository;
    private final ObjectMapper objectMapper;

    // 메모리 캐시 (빠른 접근용)
    private final Map<String, Deque<ChatMessage>> memoryCache = new ConcurrentHashMap<>();

    // 캐시 설정
    private static final String CACHE_PREFIX = "chat:room:";
    private static final String CACHE_SUFFIX = ":messages";
    private static final int MEMORY_CACHE_SIZE = 50;  // 메모리에는 최근 50개만
    private static final int REDIS_CACHE_SIZE = 100;  // Redis에는 최근 100개
    private static final Duration CACHE_TTL = Duration.ofDays(7); // 7일 TTL

    @PostConstruct
    public void initializeCache() {
        log.info("ChatCacheService 초기화 시작");
        warmUpCacheFromDatabase();
        log.info("ChatCacheService 초기화 완료");
    }

    /**
     * 메시지를 모든 캐시에 추가
     */
    public void addMessage(String roomId, ChatMessage message) {
        // 1. 메모리 캐시에 추가 (가장 빠름)
        addToMemoryCache(roomId, message);

        // 2. Redis 캐시에 비동기 추가 (영속성)
        addToRedisCache(roomId, message);
    }

    /**
     * 메모리 캐시에 메시지 추가
     */
    private void addToMemoryCache(String roomId, ChatMessage message) {
        try {
            Deque<ChatMessage> cache = memoryCache.computeIfAbsent(roomId, k -> new LinkedList<>());

            synchronized (cache) {
                cache.addLast(message);

                // 메모리 캐시 크기 제한
                while (cache.size() > MEMORY_CACHE_SIZE) {
                    ChatMessage removed = cache.removeFirst();
                    log.debug("메모리 캐시에서 오래된 메시지 제거: {}", removed.getId());
                }
            }

            log.debug("메모리 캐시에 메시지 추가: {} (방: {}, 크기: {})",
                message.getId(), roomId, cache.size());

        } catch (Exception e) {
            log.error("메모리 캐시 추가 실패", e);
        }
    }

    /**
     * Redis 캐시에 메시지 추가
     */
    private void addToRedisCache(String roomId, ChatMessage message) {
        try {
            String key = CACHE_PREFIX + roomId + CACHE_SUFFIX;
            String messageJson = objectMapper.writeValueAsString(message);

            // Redis 리스트에 추가
            redisTemplate.opsForList().rightPush(key, messageJson);

            // 크기 제한 (최근 100개만 유지)
            redisTemplate.opsForList().trim(key, -REDIS_CACHE_SIZE, -1);

            // TTL 설정
            redisTemplate.expire(key, CACHE_TTL);

            log.debug("Redis 캐시에 메시지 추가: {} (방: {})", message.getId(), roomId);

        } catch (Exception e) {
            log.error("Redis 캐시 추가 실패 - 방: {}, 메시지: {}", roomId, message.getId(), e);
        }
    }

    /**
     * 최근 메시지 조회 (메모리 → Redis → DB 순서)
     */
    public List<ChatMessage> getRecentMessages(String roomId) {
        // 1. 메모리 캐시에서 먼저 확인
        List<ChatMessage> messages = getFromMemoryCache(roomId);
        if (!messages.isEmpty()) {
            log.debug("메모리 캐시에서 메시지 조회: {} (방: {}, 개수: {})",
                "HIT", roomId, messages.size());
            return messages;
        }

        // 2. Redis 캐시에서 확인
        messages = getFromRedisCache(roomId);
        if (!messages.isEmpty()) {
            log.debug("Redis 캐시에서 메시지 조회: {} (방: {}, 개수: {})",
                "HIT", roomId, messages.size());

            // Redis에서 가져온 데이터를 메모리 캐시에도 저장
            loadToMemoryCache(roomId, messages);
            return messages;
        }

        // 3. DB에서 조회 (캐시 미스)
        messages = getFromDatabase(roomId);
        if (!messages.isEmpty()) {
            log.debug("DB에서 메시지 조회: {} (방: {}, 개수: {})",
                "MISS", roomId, messages.size());

            // DB에서 가져온 데이터를 캐시에 저장
            loadToMemoryCache(roomId, messages);
            loadToRedisCache(roomId, messages);
        }

        return messages;
    }

    /**
     * 메모리 캐시에서 조회
     */
    private List<ChatMessage> getFromMemoryCache(String roomId) {
        Deque<ChatMessage> cache = memoryCache.get(roomId);
        if (cache != null && !cache.isEmpty()) {
            synchronized (cache) {
                return new ArrayList<>(cache);
            }
        }
        return new ArrayList<>();
    }

    /**
     * Redis 캐시에서 조회
     */
    private List<ChatMessage> getFromRedisCache(String roomId) {
        try {
            String key = CACHE_PREFIX + roomId + CACHE_SUFFIX;
            List<Object> jsonList = redisTemplate.opsForList().range(key, 0, -1);

            if (jsonList != null && !jsonList.isEmpty()) {
                return jsonList.stream()
                    .map(json -> {
                        try {
                            return objectMapper.readValue(json.toString(), ChatMessage.class);
                        } catch (JsonProcessingException e) {
                            log.error("Redis 메시지 역직렬화 실패", e);
                            return null;
                        }
                    })
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
            }

        } catch (Exception e) {
            log.error("Redis 캐시 조회 실패 - 방: {}", roomId, e);
        }

        return new ArrayList<>();
    }

    /**
     * DB에서 조회
     */
    private List<ChatMessage> getFromDatabase(String roomId) {
        try {
            List<ChatMessageEntity> entities = chatMessageRepository
                .findRecentMessages(roomId, PageRequest.of(0, REDIS_CACHE_SIZE));

            // 시간순으로 정렬 (오래된 것부터)
            return entities.stream()
                .sorted(Comparator.comparing(ChatMessageEntity::getCreatedAt))
                .map(this::convertToMessage)
                .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("DB에서 메시지 조회 실패 - 방: {}", roomId, e);
            return new ArrayList<>();
        }
    }

    /**
     * 메모리 캐시에 메시지 리스트 로드
     */
    private void loadToMemoryCache(String roomId, List<ChatMessage> messages) {
        if (messages.isEmpty()) return;

        try {
            Deque<ChatMessage> cache = new LinkedList<>();

            // 최근 메시지만 메모리에 저장
            List<ChatMessage> recentMessages = messages.stream()
                .skip(Math.max(0, messages.size() - MEMORY_CACHE_SIZE))
                .collect(Collectors.toList());

            cache.addAll(recentMessages);
            memoryCache.put(roomId, cache);

            log.debug("메모리 캐시에 메시지 로드: {} (방: {}, 개수: {})",
                "LOADED", roomId, cache.size());

        } catch (Exception e) {
            log.error("메모리 캐시 로드 실패", e);
        }
    }

    /**
     * Redis 캐시에 메시지 리스트 로드
     */
    private void loadToRedisCache(String roomId, List<ChatMessage> messages) {
        if (messages.isEmpty()) return;

        try {
            String key = CACHE_PREFIX + roomId + CACHE_SUFFIX;

            // 기존 캐시 삭제
            redisTemplate.delete(key);

            // 새 메시지들 추가
            for (ChatMessage message : messages) {
                String messageJson = objectMapper.writeValueAsString(message);
                redisTemplate.opsForList().rightPush(key, messageJson);
            }

            // TTL 설정
            redisTemplate.expire(key, CACHE_TTL);

            log.debug("Redis 캐시에 메시지 로드: {} (방: {}, 개수: {})",
                "LOADED", roomId, messages.size());

        } catch (Exception e) {
            log.error("Redis 캐시 로드 실패", e);
        }
    }

    /**
     * 서버 시작시 활성 방들의 캐시 워밍업
     */
    private void warmUpCacheFromDatabase() {
        try {
            List<String> activeRooms = chatMessageRepository.findActiveRooms();
            log.info("활성 방 {}개에 대해 캐시 워밍업 시작", activeRooms.size());

            for (String roomId : activeRooms) {
                List<ChatMessage> messages = getFromDatabase(roomId);
                if (!messages.isEmpty()) {
                    loadToMemoryCache(roomId, messages);
                    loadToRedisCache(roomId, messages);
                }
            }

            log.info("캐시 워밍업 완료: {}개 방", activeRooms.size());

        } catch (Exception e) {
            log.error("캐시 워밍업 실패", e);
        }
    }

    /**
     * 캐시 정리 (메모리 절약)
     */
    public void cleanupInactiveRoomCache(String roomId) {
        try {
            // 메모리 캐시에서 제거
            memoryCache.remove(roomId);

            // Redis 캐시는 TTL로 자동 만료되므로 별도 삭제 안함
            log.info("비활성 방 캐시 정리: {}", roomId);

        } catch (Exception e) {
            log.error("캐시 정리 실패 - 방: {}", roomId, e);
        }
    }

    /**
     * ChatMessageEntity를 ChatMessage로 변환
     */
    private ChatMessage convertToMessage(ChatMessageEntity entity) {
        return ChatMessage.builder()
            .id(entity.getMessageId())
            .type(entity.getMessageType())
            .roomId(entity.getRoomId())
            .senderId(entity.getSenderId())
            .senderName(entity.getSenderName())
            .content(entity.getContent())
            .timestamp(entity.getCreatedAt())
            .build();
    }
}