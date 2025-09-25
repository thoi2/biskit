package com.example.backend.chat.repository;

import com.example.backend.chat.entity.Room;
import org.springframework.data.domain.Pageable;
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
     * roomUuid로 활성화된 방 조회
     */
    Optional<Room> findByRoomUuidAndIsActiveTrue(String roomUuid);


    /**
     * 사용자가 참여중인 방 목록 조회
     */
    @Query("SELECT DISTINCT r FROM Room r " +
           "JOIN r.participants p " +
           "WHERE p.userId = :userId AND p.isActive = true AND r.isActive = true " +
           "ORDER BY r.updatedAt DESC")
    List<Room> findUserActiveRooms(@Param("userId") String userId);


    /**
     * roomUuid 존재 여부 확인
     */
    boolean existsByRoomUuid(String roomUuid);

    /**
     * 카테고리별 활성화된 방 조회 (참여 인원 많은 순)
     */
    @Query("SELECT r FROM Room r WHERE r.isActive = true AND r.bigCategory = :bigCategory ORDER BY r.currentParticipants DESC, r.createdAt DESC")
    List<Room> findByBigCategoryAndIsActiveTrueOrderByParticipantsDesc(@Param("bigCategory") String bigCategory);

    /**
     * 모든 활성화된 방 조회 (참여 인원 많은 순)
     */
    @Query("SELECT r FROM Room r WHERE r.isActive = true ORDER BY r.currentParticipants DESC, r.createdAt DESC")
    List<Room> findByIsActiveTrueOrderByParticipantsDesc();

    /**
     * 모든 활성화된 방 조회 (페이징 - 첫 페이지, 생성시간 기준)
     */
    @Query("SELECT r FROM Room r WHERE r.isActive = true ORDER BY r.createdAt DESC, r.id ASC")
    List<Room> findByIsActiveTrueOrderByCreatedAtDescRoomIdAsc(Pageable pageable);

    /**
     * 모든 활성화된 방 조회 (페이징 - 커서 기반, 생성시간 기준)
     */
    @Query("SELECT r FROM Room r WHERE r.isActive = true " +
           "AND (r.createdAt < :cursorCreatedAt OR (r.createdAt = :cursorCreatedAt AND r.id > :cursorId)) " +
           "ORDER BY r.createdAt DESC, r.id ASC")
    List<Room> findByIsActiveTrueAndCursorOrderByCreatedAtDescRoomIdAsc(
        @Param("cursorCreatedAt") java.time.LocalDateTime cursorCreatedAt,
        @Param("cursorId") Long cursorId,
        Pageable pageable);

    /**
     * 카테고리별 활성화된 방 조회 (페이징 - 첫 페이지, 생성시간 기준)
     */
    @Query("SELECT r FROM Room r WHERE r.isActive = true AND r.bigCategory = :bigCategory " +
           "ORDER BY r.createdAt DESC, r.id ASC")
    List<Room> findByBigCategoryAndIsActiveTrueOrderByCreatedAtDescRoomIdAsc(
        @Param("bigCategory") String bigCategory,
        Pageable pageable);

    /**
     * 카테고리별 활성화된 방 조회 (페이징 - 커서 기반, 생성시간 기준)
     */
    @Query("SELECT r FROM Room r WHERE r.isActive = true AND r.bigCategory = :bigCategory " +
           "AND (r.createdAt < :cursorCreatedAt OR (r.createdAt = :cursorCreatedAt AND r.id > :cursorId)) " +
           "ORDER BY r.createdAt DESC, r.id ASC")
    List<Room> findByBigCategoryAndIsActiveTrueAndCursorOrderByCreatedAtDescRoomIdAsc(
        @Param("bigCategory") String bigCategory,
        @Param("cursorCreatedAt") java.time.LocalDateTime cursorCreatedAt,
        @Param("cursorId") Long cursorId,
        Pageable pageable);
}