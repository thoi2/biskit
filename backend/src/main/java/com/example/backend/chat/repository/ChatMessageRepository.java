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
     * 최근 메시지 조회 (시간 역순)
     */
    @Query("SELECT c FROM ChatMessageEntity c WHERE c.roomId = :roomId ORDER BY c.createdAt DESC")
    List<ChatMessageEntity> findRecentMessages(@Param("roomId") String roomId, Pageable pageable);

    /**
     * 특정 메시지 ID 이전의 메시지들 조회 (무한 스크롤용)
     */
    @Query("SELECT c FROM ChatMessageEntity c WHERE c.roomId = :roomId AND c.id < :beforeId ORDER BY c.createdAt DESC")
    List<ChatMessageEntity> findMessagesBeforeId(@Param("roomId") String roomId,
                                                 @Param("beforeId") Long beforeId,
                                                 Pageable pageable);


    /**
     * 특정 시간 이후 메시지가 있는 활성 방들 조회
     */
    @Query("SELECT DISTINCT c.roomId FROM ChatMessageEntity c WHERE c.createdAt >= :since")
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
}
