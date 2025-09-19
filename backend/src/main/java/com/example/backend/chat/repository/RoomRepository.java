package com.example.backend.chat.repository;

import com.example.backend.chat.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 채팅방 Repository
 */
@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {

    /**
     * roomUuid로 방 조회
     */
    Optional<Room> findByRoomUuid(String roomUuid);

    /**
     * roomUuid로 활성화된 방 조회
     */
    Optional<Room> findByRoomUuidAndIsActiveTrue(String roomUuid);

    /**
     * 생성자ID로 방 목록 조회 (활성화된 방만)
     */
    List<Room> findByCreatorIdAndIsActiveTrueOrderByCreatedAtDesc(String creatorId);

    /**
     * 방 이름으로 검색 (활성화된 방만, LIKE 검색)
     */
    @Query("SELECT r FROM Room r WHERE r.isActive = true AND r.roomName LIKE %:roomName% ORDER BY r.createdAt DESC")
    List<Room> findByRoomNameContainingAndIsActiveTrue(@Param("roomName") String roomName);

    /**
     * 사용자가 참여중인 방 목록 조회
     */
    @Query("SELECT DISTINCT r FROM Room r " +
           "JOIN r.participants p " +
           "WHERE p.userId = :userId AND p.isActive = true AND r.isActive = true " +
           "ORDER BY r.updatedAt DESC")
    List<Room> findUserActiveRooms(@Param("userId") String userId);

    /**
     * 활성화된 모든 방 조회 (최신순)
     */
    List<Room> findByIsActiveTrueOrderByCreatedAtDesc();

    /**
     * 참여자 수가 적은 순으로 활성화된 방 조회
     */
    @Query("SELECT r FROM Room r WHERE r.isActive = true AND r.currentParticipants < r.maxParticipants ORDER BY r.currentParticipants ASC")
    List<Room> findAvailableRoomsOrderByParticipants();

    /**
     * roomUuid 존재 여부 확인
     */
    boolean existsByRoomUuid(String roomUuid);
}