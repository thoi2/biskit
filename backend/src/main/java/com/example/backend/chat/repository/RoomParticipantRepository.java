package com.example.backend.chat.repository;

import com.example.backend.chat.entity.Room;
import com.example.backend.chat.entity.RoomParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 채팅방 참여자 Repository
 */
@Repository
public interface RoomParticipantRepository extends JpaRepository<RoomParticipant, Long> {

    /**
     * 특정 방의 활성 참여자 조회 (roomUuid로)
     */
    @Query("SELECT p FROM RoomParticipant p WHERE p.room.roomUuid = :roomUuid AND p.isActive = true ORDER BY p.joinedAt ASC")
    List<RoomParticipant> findActiveParticipantsByRoomUuid(@Param("roomUuid") String roomUuid);

    /**
     * 사용자의 특정 방 참여 정보 조회
     */
    @Query("SELECT p FROM RoomParticipant p WHERE p.room.roomUuid = :roomUuid AND p.userId = :userId")
    Optional<RoomParticipant> findByRoomUuidAndUserId(@Param("roomUuid") String roomUuid, @Param("userId") String userId);


    /**
     * 사용자가 특정 방에 활성 참여중인지 확인
     */
    @Query("SELECT COUNT(p) > 0 FROM RoomParticipant p WHERE p.room.roomUuid = :roomUuid AND p.userId = :userId AND p.isActive = true")
    boolean existsActiveParticipant(@Param("roomUuid") String roomUuid, @Param("userId") String userId);


    /**
     * 사용자의 특정 방 참여 상태를 비활성화 (방 나가기)
     */
    @Modifying
    @Query("UPDATE RoomParticipant p SET p.isActive = false, p.leftAt = CURRENT_TIMESTAMP WHERE p.room.roomUuid = :roomUuid AND p.userId = :userId AND p.isActive = true")
    int deactivateParticipant(@Param("roomUuid") String roomUuid, @Param("userId") String userId);

}