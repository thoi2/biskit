package com.example.backend.chat.repository;

import com.example.backend.chat.entity.ChatMessageEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessageEntity, Long> {

    /**
     * 방의 최근 N개 메시지 조회 (최신순)
     */
    @Query("SELECT c FROM ChatMessageEntity c WHERE c.roomId = :roomId ORDER BY c.createdAt DESC")
    List<ChatMessageEntity> findRecentMessagesByRoomId(@Param("roomId") String roomId, Pageable pageable);

    /**
     * 방의 최근 100개 메시지 조회 (시간순 정렬)
     */
    @Query("SELECT c FROM ChatMessageEntity c WHERE c.roomId = :roomId ORDER BY c.createdAt DESC LIMIT 100")
    List<ChatMessageEntity> findTop100ByRoomIdOrderByCreatedAtDesc(@Param("roomId") String roomId);

    /**
     * 특정 시간 이후의 메시지 조회
     */
    @Query("SELECT c FROM ChatMessageEntity c WHERE c.roomId = :roomId AND c.createdAt > :since ORDER BY c.createdAt ASC")
    List<ChatMessageEntity> findMessagesSince(@Param("roomId") String roomId, @Param("since") LocalDateTime since);

    /**
     * 특정 메시지 ID 이전의 메시지들 조회 (무한 스크롤용)
     */
    @Query("SELECT c FROM ChatMessageEntity c WHERE c.roomId = :roomId AND c.id < :beforeId ORDER BY c.createdAt DESC")
    List<ChatMessageEntity> findMessagesBeforeId(@Param("roomId") String roomId,
                                                 @Param("beforeId") Long beforeId,
                                                 Pageable pageable);

    /**
     * 방의 총 메시지 수
     */
    long countByRoomId(String roomId);

    /**
     * 최근 활동이 있는 방들 조회 (워밍업용)
     */
    @Query("SELECT DISTINCT c.roomId FROM ChatMessageEntity c WHERE c.createdAt > :since")
    List<String> findActiveRoomsSince(@Param("since") LocalDateTime since);

    /**
     * 활성화된 방들 (최근 7일)
     */
    default List<String> findActiveRooms() {
        return findActiveRoomsSince(LocalDateTime.now().minusDays(7));
    }

    /**
     * 메시지 ID로 단일 메시지 조회
     */
    ChatMessageEntity findByMessageId(String messageId);

    /**
     * 특정 기간 내 메시지들 조회
     */
    @Query("SELECT c FROM ChatMessageEntity c WHERE c.roomId = :roomId AND c.createdAt BETWEEN :startTime AND :endTime ORDER BY c.createdAt ASC")
    List<ChatMessageEntity> findMessagesBetween(@Param("roomId") String roomId,
                                                @Param("startTime") LocalDateTime startTime,
                                                @Param("endTime") LocalDateTime endTime);

    /**
     * 오래된 메시지 삭제 (정리용)
     */
    @Query("DELETE FROM ChatMessageEntity c WHERE c.createdAt < :cutoffDate")
    void deleteOldMessages(@Param("cutoffDate") LocalDateTime cutoffDate);
}
